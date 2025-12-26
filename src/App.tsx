import React, {useEffect, useRef, useState} from 'react';
import type {Alert, SystemState} from './types';
import {scenarioEvents} from './data/scenario';
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
        score: 0,
    });
    const [finished, setFinished] = useState(false);
    const [metrics, setMetrics] = useState<MetricPoint[]>([]);
    const systemRef = useRef(system);
    const [started, setStarted] = useState<boolean>(false);

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
                },
            ]);
        }, 500); // sample every 500ms

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        // Track timeout IDs so we can clear them on cleanup.
        const timers: number[] = [];

        scenarioEvents.forEach(event => {
            const id = window.setTimeout(() => {
                // Use functional updates to avoid stale closures and prevent double additions
                setAlerts(prev => [
                    ...prev,
                    {
                        id: ++alertId,
                        severity: event.severity,
                        message: event.message,
                        recommendedAction: event.recommendedAction,
                        acknowledged: false,
                    },
                ]);

                // Update system and then record metrics using the updated state values
                setSystem(prev => {
                    const next = {
                        ...prev,
                        stability: Math.max(0, prev.stability - 10),
                        trustLevel: Math.max(0, prev.trustLevel - 15),
                    };

                    setMetrics(mPrev => [
                        ...mPrev,
                        {
                            time: Date.now(),
                            stability: next.stability,
                            trust: next.trustLevel,
                        },
                    ]);

                    return next;
                });

            }, event.time);

            timers.push(id);
        });

        const finishId = window.setTimeout(() => setFinished(true), 150000); // finish after 150s
        timers.push(finishId);

        return () => {
            // Clear any scheduled timeouts when the effect is cleaned up (React StrictMode mounts/unmounts in dev)
            timers.forEach(t => clearTimeout(t));
        };
    }, []);

    const acknowledgeAlert = (id: number) => {
        // Remove the acknowledged alert from the list so it disappears from the UI
        // and remaining alerts shift up to fill the gap.
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const performAction = (action: string) => {
        setMetrics(prev => [
            ...prev,
            {
                time: Date.now(),
                stability: system.stability,
                trust: system.trustLevel,
            },
        ]);

        switch(action) {
            case 'rotate':
                setSystem(s => ({...s, trustLevel: s.trustLevel + 20, score: s.score + 10}));
                break;

            case 'limit':
                setSystem(s => ({...s, stability: s.stability + 15, score: s.score + 10}));
                break;

            case 'escalate':
                setSystem(s => ({...s, score: s.score + 5}));
                break;
        }
    };

    const handleStart = () => setStarted(true);

    return (
        <div className="app">
            {!started ? (
                <TitlePage onStart={handleStart} />
            ) : (
                <>
                    <h1>Q-Ready: Post-Quantum Grid Incident Simulation</h1>

                    <MetricGraph data={metrics} />
                    <StatusPanel system={system}/>
                    <ActionPanel onAction={performAction}/>

                    <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert}/>

                    {finished && <ScorePanel score={system.score}/>}
                </>
            )}
        </div>
    );
};

export default App;
