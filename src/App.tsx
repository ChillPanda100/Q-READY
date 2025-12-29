import React, {useEffect, useRef, useState} from 'react';
import type {Alert, SystemState} from './types';
import {scenarioEvents} from './data/scenario';
import type {ScenarioEvent} from './data/scenario';
import AlertsPanel from './components/AlertsPanel';
import ActionPanel from './components/ActionPanel';
import StatusPanel from './components/StatusPanel.tsx';
import ScorePanel from './components/ScorePanel';
import MetricGraph from './components/MetricGraph';
import type {MetricPoint} from './types';
import TitlePage from './components/TitlePage';


let alertId = 0;

const App: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [system, setSystem] = useState<SystemState>({
        stability: 100,
        trustLevel: 100,
        firmwareIntegrity: 100,
        certHealth: 100,
        networkHealth: 100,
        score: 0,
    });
    const [finished, setFinished] = useState(false);
    const [metrics, setMetrics] = useState<MetricPoint[]>([]);
    const systemRef = useRef(system);
    const actionTimersRef = useRef<number[]>([]);
    const [started, setStarted] = useState<boolean>(false);
    const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});

    // keep ref synced so interval can read latest values without re-creating
    useEffect(() => {
        systemRef.current = system;
    }, [system]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => [
                ...prev.slice(-240), // keep last ~240 points (120s at 500ms)
                {
                    time: Date.now(), // absolute timestamp
                    stability: systemRef.current.stability,
                    trust: systemRef.current.trustLevel,
                    firmwareIntegrity: systemRef.current.firmwareIntegrity,
                    certHealth: systemRef.current.certHealth,
                    networkHealth: systemRef.current.networkHealth,
                },
            ]);
        }, 500); // sample every 500ms

        return () => clearInterval(interval);
    }, []);


    // Schedule scenario events when the simulation starts. Timers are relative to start.
    useEffect(() => {
        if (!started) return;
        const timers: number[] = [];

        scenarioEvents.forEach((event: ScenarioEvent) => {
            const id = window.setTimeout(() => {
                setAlerts(prev => {
                    // avoid adding duplicate alerts with the same message
                    if (prev.some(a => a.message === event.message)) return prev;
                    return [
                        ...prev,
                        {
                            id: ++alertId,
                            severity: event.severity,
                            message: event.message,
                            recommendedAction: event.recommendedAction,
                            acknowledged: false,
                        },
                    ];
                });

                setSystem(prev => {
                    const stabilityDelta = event.stabilityDelta ?? -10;
                    const trustDelta = event.trustDelta ?? -15;
                    const next = {
                        ...prev,
                        stability: Math.max(0, prev.stability + stabilityDelta),
                        trustLevel: Math.max(0, prev.trustLevel + trustDelta),
                    };

                    setMetrics(mPrev => [
                        ...mPrev,
                        {
                            time: Date.now(),
                            stability: next.stability,
                            trust: next.trustLevel,
                            firmwareIntegrity: next.firmwareIntegrity,
                            certHealth: next.certHealth,
                            networkHealth: next.networkHealth,
                        },
                    ]);

                    return next;
                });
            }, event.time);

            timers.push(id);
        });

        const finishId = window.setTimeout(() => setFinished(true), 150000); // finish after 150s
        timers.push(finishId);

        // capture current action timers so cleanup can clear them too
        const actionTimers = actionTimersRef.current.slice();

        return () => {
            timers.forEach(t => clearTimeout(t));
            actionTimers.forEach(t => clearTimeout(t));
        };
    }, [started]);

    const acknowledgeAlert = (id: number) => {
        // Remove the acknowledged alert from the list so it disappears from the UI
        // and remaining alerts shift up to fill the gap.
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const performAction = (action: string) => {
        // if already running, ignore
        if (actionInProgress[action]) return;
        // mark as in-progress
        setActionInProgress(prev => ({...prev, [action]: true}));

        // record a snapshot immediately (pre-action) including all metrics
        setMetrics(prev => [
            ...prev,
            {
                time: Date.now(),
                stability: system.stability,
                trust: system.trustLevel,
                firmwareIntegrity: system.firmwareIntegrity,
                certHealth: system.certHealth,
                networkHealth: system.networkHealth,
            },
        ]);

        // simulate action duration and effect; durations in ms
        const durations: Record<string, number> = {
            rotate: 3000,
            limit: 2000,
            escalate: 1200,
            patch: 6000,
            renew: 4000,
            'mitigate-network': 3500,
            reboot: 5000,
        };
        const timeout = durations[action] ?? 2000;
        const timerId = window.setTimeout(() => {
            // apply the action effects now (on completion)
            switch(action) {
                case 'rotate':
                    setSystem(s => ({...s, trustLevel: Math.min(100, s.trustLevel + 20), score: s.score + 10}));
                    break;

                case 'limit':
                    setSystem(s => ({...s, stability: Math.min(100, s.stability + 15), score: s.score + 10}));
                    break;

                case 'escalate':
                    setSystem(s => ({...s, score: s.score + 5}));
                    break;
                case 'patch':
                    setSystem(s => ({...s, firmwareIntegrity: Math.min(100, s.firmwareIntegrity + 20), stability: Math.min(100, s.stability + 8), score: s.score + 8}));
                    break;
                case 'renew':
                    setSystem(s => ({...s, certHealth: Math.min(100, s.certHealth + 25), trustLevel: Math.min(100, s.trustLevel + 12), score: s.score + 10}));
                    break;
                case 'mitigate-network':
                    setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 20), stability: Math.min(100, s.stability + 6), score: s.score + 7}));
                    break;
                case 'reboot':
                    setSystem(s => ({...s, firmwareIntegrity: Math.max(0, s.firmwareIntegrity - 5), stability: Math.max(0, s.stability + 5), score: s.score + 3}));
                    break;
            }

            // mark completed
            setActionInProgress(prev => ({...prev, [action]: false}));

            // record a snapshot after action completes
            setMetrics(prev => [
                ...prev,
                {
                    time: Date.now(),
                    stability: systemRef.current.stability,
                    trust: systemRef.current.trustLevel,
                    firmwareIntegrity: systemRef.current.firmwareIntegrity,
                    certHealth: systemRef.current.certHealth,
                    networkHealth: systemRef.current.networkHealth,
                }
            ]);
        }, timeout);

        // record timer id to clear on unmount
        actionTimersRef.current.push(timerId);

        return;
    };
    // end performAction

    const handleStart = () => setStarted(true);

    return (
        <div className="app">
            {!started ? (
                <TitlePage onStart={handleStart} />
            ) : (
                <>
                    <h1>Q-Ready: Post-Quantum Grid Incident Simulation</h1>

                    <div className="grid-row">
                        <MetricGraph data={metrics} />
                        <StatusPanel system={system} />
                    </div>

                    <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />

                    {finished && <ScorePanel score={system.score} />}

                    <ActionPanel onAction={performAction} inProgress={actionInProgress} />
                 </>
             )}
         </div>
     );
 };

export default App;
