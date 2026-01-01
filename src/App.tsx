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
import SideDashboard from './components/SideDashboard';


let alertId = 0;

const App: React.FC = () => {
    const [dashboardOpen, setDashboardOpen] = useState(false);
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
    const [authorizedEmergency, setAuthorizedEmergency] = useState<boolean>(false);
    const [pqOnCooldown, setPqOnCooldown] = useState<boolean>(false);
    const pqCooldownRef = useRef<number | null>(null);

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
                setAlerts((prev): Alert[] => {
                    // avoid adding duplicate alerts with the same message
                    if (prev.some(a => a.message === event.message)) return prev;
                    const newAlert = {
                        id: ++alertId,
                        severity: event.severity,
                        message: event.message,
                        recommendedAction: event.recommendedAction,
                        acknowledged: false,
                    } as Alert;

                    return [...prev, newAlert];
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
            'isolate-segment': 2400,
            'restore-autonomy': 2200,
            'enforce-pq': 5000,
            'verify-signatures': 2500,
            'rollback': 6000,
            'segment-network': 2500,
            'restore-routing': 3000,
            'acknowledge-ai': 800,
            'authorize-emergency': 600,
        };
        const timeout = durations[action] ?? 2000;
        const timerId = window.setTimeout(() => {
            // apply the action effects now (on completion)
            switch(action) {
                // Panel 2 — PKI actions
                case 'rotate':
                    // Rotate keys: big trust gain, small network hit
                    setSystem(s => ({...s, trustLevel: Math.min(100, s.trustLevel + 22), networkHealth: Math.max(0, s.networkHealth - 6), score: s.score + 10}));
                    // recover network health slowly
                    actionTimersRef.current.push(window.setTimeout(() => setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 6)})), 8000));
                    break;

                // Panel 1 — DER / Grid
                case 'limit':
                    setSystem(s => ({...s, stability: Math.min(100, s.stability + 12), score: s.score + 8}));
                    break;

                case 'reboot':
                    // big stability boost, firmware hit, temporary network hit
                    setSystem(s => ({...s, stability: Math.min(100, s.stability + 22), firmwareIntegrity: Math.max(0, s.firmwareIntegrity - 12), networkHealth: Math.max(0, s.networkHealth - 18), score: s.score + 12}));
                    // recover network over time
                    actionTimersRef.current.push(window.setTimeout(() => setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 12)})), 9000));
                    break;

                case 'isolate-segment':
                    setSystem(s => ({...s, stability: Math.min(100, s.stability + 10), networkHealth: Math.max(0, s.networkHealth - 10), score: s.score + 6}));
                    break;

                case 'restore-autonomy':
                    // only available when system.stability >= 80 (button disabled otherwise)
                    setSystem(s => ({...s, stability: Math.max(0, s.stability - 5), networkHealth: Math.min(100, s.networkHealth + 8), score: s.score + 4}));
                    break;

                // PKI continued
                case 'renew':
                    setSystem(s => ({...s, certHealth: Math.min(100, s.certHealth + 25), trustLevel: Math.min(100, s.trustLevel + 12), score: s.score + 10}));
                    break;

                case 'enforce-pq': {
                    // enforce PQ: big trust gain, large network hit, cooldown
                    if (!authorizedEmergency || pqOnCooldown) break;
                    setSystem(s => ({...s, trustLevel: Math.min(100, s.trustLevel + 28), networkHealth: Math.max(0, s.networkHealth - 30), score: s.score + 18}));
                    setPqOnCooldown(true);
                    // cooldown 30s
                    const pqTimerLocal = window.setTimeout(() => setPqOnCooldown(false), 30000);
                    if (pqCooldownRef.current) clearTimeout(pqCooldownRef.current);
                    pqCooldownRef.current = pqTimerLocal;
                    actionTimersRef.current.push(pqTimerLocal);
                    // gradual network recovery
                    actionTimersRef.current.push(window.setTimeout(() => setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 20)})), 20000));
                    break;
                }

                // Firmware
                case 'patch':
                    setSystem(s => ({...s, firmwareIntegrity: Math.min(100, s.firmwareIntegrity + 30), stability: Math.max(0, s.stability - 10), networkHealth: Math.max(0, s.networkHealth - 8), score: s.score + 10}));
                    // simulate stabilization after patch completes
                    actionTimersRef.current.push(window.setTimeout(() => setSystem(s => ({...s, stability: Math.min(100, s.stability + 8)})), 9000));
                    break;

                case 'verify-signatures':
                    setSystem(s => ({...s, firmwareIntegrity: Math.min(100, s.firmwareIntegrity + 8), trustLevel: Math.min(100, s.trustLevel + 5), score: s.score + 6}));
                    break;

                case 'rollback':
                    if (!authorizedEmergency) break;
                    setSystem(s => ({...s, firmwareIntegrity: Math.min(100, s.firmwareIntegrity + 15), stability: Math.max(0, s.stability - 25), score: s.score + 12}));
                    break;

                // Network
                case 'mitigate-network':
                    setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 25), stability: Math.min(100, s.stability + 8), score: s.score + 9}));
                    break;

                case 'segment-network':
                    setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 10), stability: Math.max(0, s.stability - 8), score: s.score + 7}));
                    break;

                case 'restore-routing':
                    setSystem(s => ({...s, networkHealth: Math.min(100, s.networkHealth + 18), stability: Math.min(100, s.stability + 10), score: s.score + 10}));
                    break;

                // Incident command
                case 'escalate':
                    setSystem(s => ({...s, score: s.score + 5}));
                    break;

                case 'acknowledge-ai':
                    // remove the oldest alert if any
                    setAlerts(prev => prev.slice(1));
                    setSystem(s => ({...s, score: s.score + 2}));
                    break;

                case 'authorize-emergency':
                    setAuthorizedEmergency(true);
                    setSystem(s => ({...s, score: s.score + 5}));
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

    // cleanup pq cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (pqCooldownRef.current) clearTimeout(pqCooldownRef.current);
        };
    }, []);

    const handleStart = () => setStarted(true);

    return (
        <div className={`app ${dashboardOpen ? 'dashboard-open' : ''}`}>
            {/* top-left hamburger to toggle side dashboard */}
            <button className="hamburger" aria-label="Open dashboard" onClick={() => setDashboardOpen(true)}>
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
            </button>

            <div className={`side-dashboard-backdrop ${dashboardOpen ? 'open' : ''}`} onClick={() => setDashboardOpen(false)} />
            <SideDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
            {!started ? (
                <TitlePage onStart={handleStart} />
            ) : (
                <>
                    <h1 style={{textAlign: 'center', marginBottom: 20}}>Q-Ready: Post-Quantum Grid Incident Simulation</h1>

                    <div className="grid-row">
                        <MetricGraph data={metrics} />
                        <StatusPanel system={system} />
                    </div>

                    <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />

                    {finished && <ScorePanel score={system.score} />}

                    <ActionPanel onAction={performAction} inProgress={actionInProgress} system={system} authorizedEmergency={authorizedEmergency} pqOnCooldown={pqOnCooldown} onAuthorize={() => setAuthorizedEmergency(true)} />
                 </>
             )}
         </div>
     );
 };

 export default App;
