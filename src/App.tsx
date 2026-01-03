import React, {useEffect, useRef, useState} from 'react';
import type {Alert, SystemState} from './types';
import {scenarioEvents} from './data/scenario';
import type {ScenarioEvent} from './data/scenario';
import AlertsPanel from './components/AlertsPanel';
import ActionPanel from './components/ActionPanel';
import StatusPanel from './components/StatusPanel.tsx';
import FinalScoreModal from './components/FinalScoreModal';
import MetricGraph from './components/MetricGraph';
import type {MetricPoint, ActionRecord} from './types';
import TitlePage from './components/TitlePage';
import SideDashboard from './components/SideDashboard';
import AlertHistoryDrawer from './components/AlertHistoryDrawer';


let alertId = 0;
let actionId = 0;

const App: React.FC = () => {
     const [dashboardOpen, setDashboardOpen] = useState(false);
     const [alertHistoryOpen, setAlertHistoryOpen] = useState(false);
     const [alerts, setAlerts] = useState<Alert[]>([]);
     // helper: severity order (high first)
     // NOTE: previously defined but unused; remove or keep if needed later.
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
    const [actionsHistory, setActionsHistory] = useState<ActionRecord[]>([]);
    const [hiddenAlertIds, setHiddenAlertIds] = useState<number[]>([]);
    const [dashboardActiveTab, setDashboardActiveTab] = useState<'alerts' | 'actions' | undefined>(undefined);
    // Final modal flag (start closed in normal runs)
    const [finalModalOpen, setFinalModalOpen] = useState(false);

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

                     const newAlert: Alert = {
                        id: ++alertId,
                        severity: event.severity,
                        message: event.message,
                        recommendedAction: event.recommendedAction,
                        acknowledged: false,

                        createdAt: Date.now(),
                        status: 'active',
                        // infer metrics more robustly from message keywords
                        affectedMetrics: (() => {
                            const m = event.message.toLowerCase();
                            const res: string[] = [];
                            if (/cert|certificate|ca|crypto|cryptographic|crypt|handshake|auth|authentication/.test(m)) res.push('Crypto');
                            if (/firmware|signature/.test(m)) res.push('Firmware');
                            // include control/config keywords to catch control-plane/configuration issues
                            if (/network|latency|congestion|control(?:\s|-)?plane|control|config|configuration/.test(m)) res.push('Network');
                             if (/der|grid/.test(m)) res.push('Grid');
                             return res;
                         })(),
                          aiDescription: `AI: ${event.message} — consider ${event.recommendedAction}`,
                        actionsTaken: [],
                        metricSnapshots: [
                            {
                                time: Date.now(),
                                stability: systemRef.current.stability,
                                trust: systemRef.current.trustLevel,
                                firmwareIntegrity: systemRef.current.firmwareIntegrity,
                                certHealth: systemRef.current.certHealth,
                                networkHealth: systemRef.current.networkHealth,
                            }
                        ],
                    };

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

        // finish the simulation at (latest scenario event time + 10s)
        const latestEvent = scenarioEvents.reduce((m, e) => Math.max(m, e.time || 0), 0);
        const finishDelay = Math.max(0, latestEvent + 10000);
        const finishId = window.setTimeout(() => setFinished(true), finishDelay);
        timers.push(finishId);

        // capture current action timers so cleanup can clear them too
        const actionTimers = actionTimersRef.current.slice();

        return () => {
            timers.forEach(t => clearTimeout(t));
            actionTimers.forEach(t => clearTimeout(t));
        };
    }, [started]);

    // API to mark alert resolved/escalated from UI or operator actions
    const resolveAlert = (id: number, summary: string, confidence: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? {...a, status: 'resolved', resolutionTimestamp: Date.now(), resolutionSummary: summary, confidence, actionsTaken: a.actionsTaken ?? []} : a));
    };

    const escalateAlert = (id: number, summary?: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'escalated', resolutionTimestamp: Date.now(), resolutionSummary: summary ?? 'Escalated to higher authority', actionsTaken: a.actionsTaken ?? [] } : a));
    };

    // helper that decides whether an alert is resolved given a newly applied action and history
    const checkResolve = (alert: Alert, appliedAction: string): boolean => {
        // simple heuristics:
        const msg = `${alert.recommendedAction} ${alert.message}`.toLowerCase();
        // if recommendedAction mentions the action name, consider it resolving
        if (msg.includes(appliedAction)) return true;

        // map some actions to keywords
        const actionToKeywords: Record<string, string[]> = {
            rotate: ['rotate', 'rotate keys', 'rotate cryptographic'],
            renew: ['renew', 'certificate', 'cert'],
            patch: ['patch'],
            'mitigate-network': ['mitigate', 'mitigat', 'mitigation'],
            'restore-routing': ['route', 'routing'],
            'isolate-segment': ['isolate', 'quarantine'],
            rollback: ['rollback'],
            'enforce-pq': ['pq', 'post-quantum', 'enforce'],
        };

        const keywords = actionToKeywords[appliedAction] || [];
        for (const kw of keywords) {
            if (msg.includes(kw)) return true;
        }

        // special rule: rollback requires prior authorize-emergency action
        if (appliedAction === 'rollback') {
            return (alert.actionsTaken || []).includes('authorize-emergency');

        }

        // fallback: if alert recommends 'escalate' and appliedAction is 'escalate', mark escalated (not resolved)
        if (appliedAction === 'escalate') return false;

        return false;
    };

    const acknowledgeAlert = (id: number) => {
        // Remove the acknowledged alert from the list (restore previous behavior)
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const performAction = (action: string) => {
         // if already running, ignore
         if (actionInProgress[action]) return;
         // mark as in-progress
         setActionInProgress(prev => ({...prev, [action]: true}));

        // open dashboard and switch to Actions tab so user sees activity immediately
        setDashboardOpen(true);
        setDashboardActiveTab('actions');

        // create a placeholder action record immediately so it appears in history
        const thisActionId = ++actionId;
        const preSystemSnapshot = { ...systemRef.current };
        const initialRecord: ActionRecord = {
            id: thisActionId,
            action,
            label: action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            time: Date.now(),
            triggeredBy: 'Operator',
            affectedMetrics: [],
            results: ['⟳ In progress...'],
        };
        setActionsHistory(prev => [initialRecord, ...prev]);

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
                    // remove the oldest alert if any (restore previous behavior)
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

            // compute mostRecentActiveId from current alerts if this is an escalate action
            let mostRecentActiveId: number | null = null;
            if (action === 'escalate') {
                const currentActive = alerts.filter(x => x.status === 'active');
                mostRecentActiveId = currentActive.length ? currentActive.slice().sort((x, y) => y.createdAt - x.createdAt)[0].id : null;
            }

            // Attach this operator action to active alerts and check for resolution/escalation
            setAlerts(prev => {
                return prev.map(a => {
                    if (a.status !== 'active') return a;
                     const updated: Alert = {
                         ...a,
                         actionsTaken: [...(a.actionsTaken || []), action],
                         metricSnapshots: [...(a.metricSnapshots || []), {
                             time: Date.now(),
                             stability: systemRef.current.stability,
                             trust: systemRef.current.trustLevel,
                             firmwareIntegrity: systemRef.current.firmwareIntegrity,
                             certHealth: systemRef.current.certHealth,
                             networkHealth: systemRef.current.networkHealth,
                         }],
                     };

                    // check resolution rules
                    const resolved = checkResolve(updated, action);
                    if (resolved) {
                        return { ...updated, status: 'resolved', resolutionTimestamp: Date.now(), resolutionSummary: `Resolved by action ${action}`, confidence: 'Partially mitigated' };
                    }

                    // special escalate via action 'escalate' — only escalate the most recent active alert
                    if (action === 'escalate') {
                        if (mostRecentActiveId !== null && a.id === mostRecentActiveId) {
                            return { ...updated, status: 'escalated', resolutionTimestamp: Date.now(), resolutionSummary: 'Operator escalated', confidence: 'N/A' };
                        }
                        return updated;
                    }

                    return updated;
                });
            });

            // if we escalated, hide the escalated alert from the live alerts panel
            if (action === 'escalate' && mostRecentActiveId !== null) {
                setHiddenAlertIds(prev => prev.includes(mostRecentActiveId as number) ? prev : [...prev, mostRecentActiveId as number]);
            }

            // compute metric deltas and update the action record in history to mark success
            try {
                // wait briefly for React state to update and systemRef to be synced via useEffect
                const deltaTimer = window.setTimeout(() => {
                    // compute 'after' snapshot deterministically based on the pre-action snapshot
                    const computeAfter = (actionKey: string, before: SystemState) : SystemState => {
                        // start with copy
                        const after = { ...before };
                        switch (actionKey) {
                            case 'rotate':
                                after.trustLevel = Math.min(100, after.trustLevel + 22);
                                after.networkHealth = Math.max(0, after.networkHealth - 6);
                                break;
                            case 'limit':
                                after.stability = Math.min(100, after.stability + 12);
                                break;
                            case 'reboot':
                                after.stability = Math.min(100, after.stability + 22);
                                after.firmwareIntegrity = Math.max(0, after.firmwareIntegrity - 12);
                                after.networkHealth = Math.max(0, after.networkHealth - 18);
                                break;
                            case 'isolate-segment':
                                after.stability = Math.min(100, after.stability + 10);
                                after.networkHealth = Math.max(0, after.networkHealth - 10);
                                break;
                            case 'restore-autonomy':
                                after.stability = Math.max(0, after.stability - 5);
                                after.networkHealth = Math.min(100, after.networkHealth + 8);
                                break;
                            case 'renew':
                                after.certHealth = Math.min(100, after.certHealth + 25);
                                after.trustLevel = Math.min(100, after.trustLevel + 12);
                                break;
                            case 'enforce-pq':
                                if (authorizedEmergency && !pqOnCooldown) {
                                    after.trustLevel = Math.min(100, after.trustLevel + 28);
                                    after.networkHealth = Math.max(0, after.networkHealth - 30);
                                }
                                break;
                            case 'patch':
                                after.firmwareIntegrity = Math.min(100, after.firmwareIntegrity + 30);
                                after.stability = Math.max(0, after.stability - 10);
                                after.networkHealth = Math.max(0, after.networkHealth - 8);
                                break;
                            case 'verify-signatures':
                                after.firmwareIntegrity = Math.min(100, after.firmwareIntegrity + 8);
                                after.trustLevel = Math.min(100, after.trustLevel + 5);
                                break;
                            case 'rollback':
                                if (authorizedEmergency) {
                                    after.firmwareIntegrity = Math.min(100, after.firmwareIntegrity + 15);
                                    after.stability = Math.max(0, after.stability - 25);
                                }
                                break;
                            case 'mitigate-network':
                                after.networkHealth = Math.min(100, after.networkHealth + 25);
                                after.stability = Math.min(100, after.stability + 8);
                                break;
                            case 'segment-network':
                                after.networkHealth = Math.min(100, after.networkHealth + 10);
                                after.stability = Math.max(0, after.stability - 8);
                                break;
                            case 'restore-routing':
                                after.networkHealth = Math.min(100, after.networkHealth + 18);
                                after.stability = Math.min(100, after.stability + 10);
                                break;
                            // default: no metric changes
                        }

                        return after;
                    };

                    const after = computeAfter(action, preSystemSnapshot);
                     const deltas: string[] = [];
                     const pushDelta = (name: string, before: number | undefined, afterVal: number | undefined) => {
                         if (typeof before !== 'number' || typeof afterVal !== 'number') return;
                         const diff = Math.round(afterVal - before);
                         if (diff === 0) return;
                         const sign = diff > 0 ? '+' : '';
                         deltas.push(`${name}: ${sign}${diff}`);
                     };

                     pushDelta('Stability', preSystemSnapshot.stability, after.stability);
                     pushDelta('Trust', preSystemSnapshot.trustLevel, after.trustLevel);
                     pushDelta('Firmware', preSystemSnapshot.firmwareIntegrity, after.firmwareIntegrity);
                     pushDelta('Cert Health', preSystemSnapshot.certHealth, after.certHealth);
                     pushDelta('Network', preSystemSnapshot.networkHealth, after.networkHealth);

                    // Only put the completion status in `results`; store deltas in `affectedMetrics` (or a fallback)
                    const resultsLines = ['✔ Completed'];

                    setActionsHistory(prev => prev.map(r => r.id === thisActionId ? {...r, affectedMetrics: deltas.length ? deltas : ['No significant metric changes'], results: resultsLines} : r));
                 }, 40);

                 actionTimersRef.current.push(deltaTimer);
             } catch (err) {
                 // non-fatal: leave the record as-is
                 console.error('Failed to compute action deltas', err);
             }
         }, timeout);

        // record timer id to clear on unmount
        actionTimersRef.current.push(timerId);

        return;
    };
    // end performAction

    // handler exposed to drawers/panels to perform actions
    const handlePerformAction = (action: string) => {
        performAction(action);
    };

    // cleanup pq cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (pqCooldownRef.current) clearTimeout(pqCooldownRef.current);
        };
    }, []);

    const handleStart = () => setStarted(true);

    // Compose score categories from the system state for the modal
    // Fallback categories (shown while simulation is running) — approximate using current system state and history
    const scoreCategories = [
        { label: 'System Resilience (Core Outcome)', value: Math.round(system.stability) },
        { label: 'Decision Quality & Tradeoff Management', value: Math.min(100, 50 + Math.round((actionsHistory.length || 0) * 4)) },
        { label: 'Response Timing & Prioritization', value: 70 },
        { label: 'Governance & Operational Discipline', value: Math.max(30, 100 - (actionsHistory.filter(a => a.action === 'authorize-emergency').length || 0) * 12) },
    ];

    // Compute detailed scoring across the 4 requested categories.
    const computeScores = () => {
        // recent history (not needed directly here)

        // If the operator took no actions at all, they earn zero in every category.
        // This enforces that points must be earned through operator activity.
        if (!actionsHistory || actionsHistory.length === 0) {
            const categories = [
                { label: 'System Resilience (Core Outcome)', value: 0 },
                { label: 'Decision Quality & Tradeoff Management', value: 0 },
                { label: 'Response Timing & Prioritization', value: 0 },
                { label: 'Governance & Operational Discipline', value: 0 },
            ];
            return { categories, totalScore: 0 };
        }

        // System Resilience (stricter)
        const stabilityValues = metrics.map(m => m.stability);
        const minStability = stabilityValues.length ? Math.min(...stabilityValues) : system.stability;
        const lastSnapshot: MetricPoint = metrics.length ? metrics[metrics.length - 1] : { time: Date.now(), stability: system.stability, trust: system.trustLevel, firmwareIntegrity: system.firmwareIntegrity, certHealth: system.certHealth, networkHealth: system.networkHealth };
        const recoveryFactor = minStability < lastSnapshot.stability ? (lastSnapshot.stability - minStability) / Math.max(1, 100 - minStability) : 0;

        let resilience: number;
        // More conservative thresholds and smaller bonus from current stability
        if (minStability < 10) resilience = 8;
        else if (minStability < 30) resilience = 28;
        else resilience = 50 + Math.round(system.stability * 0.3);
        // reduce the impact of recovery factor so quick recoveries don't over-inflate the score
        resilience = Math.min(100, Math.round(resilience + recoveryFactor * 12));
        // detect big drops (potential cascades) and penalize more heavily
        let largeDrops = 0;
        for (let i = 1; i < stabilityValues.length; i++) if (stabilityValues[i - 1] - stabilityValues[i] > 20) largeDrops++;
        resilience = Math.max(0, resilience - Math.min(40, largeDrops * 12));

        // Decision Quality & Tradeoff Management (harsher)
        const severityWeight = (a: Alert) => a.severity === 'high' ? 1.5 : a.severity === 'medium' ? 1.2 : 1.0;
        let totalAlertWeight = 0; let matchedAlertWeight = 0;
        alerts.forEach(a => {
            const w = severityWeight(a); totalAlertWeight += w;
            if (a.status === 'resolved') { matchedAlertWeight += w; return; }
            const takenExplicit = a.actionsTaken || [];
            const since = a.createdAt ?? 0;
            const takenFromHistory = actionsHistory.filter(h => (h.time || 0) >= since).map(h => h.action);
            const takenSet = Array.from(new Set([...takenExplicit, ...takenFromHistory]));
            const actedResolve = takenSet.some(act => { if (!act) return false; try { return checkResolve(a, act); } catch { return false; } });
            if (actedResolve) matchedAlertWeight += w;
        });
        const alertMatchRatio = totalAlertWeight ? (matchedAlertWeight / totalAlertWeight) : 0.5; // stricter default

        // Measure balance across key metrics (stability, trust, firmware, network)
        const lastMetrics = lastSnapshot;
        const metricMean = Math.round((lastMetrics.stability + lastMetrics.trust + lastMetrics.firmwareIntegrity + lastMetrics.networkHealth) / 4);
        const balancePenalty = Math.abs(lastMetrics.stability - metricMean) + Math.abs(lastMetrics.trust - metricMean) + Math.abs(lastMetrics.firmwareIntegrity - metricMean) + Math.abs(lastMetrics.networkHealth - metricMean);
        // make balance scoring harsher (bigger penalty)
        const balanceScore = Math.max(10, Math.round(100 - (balancePenalty / 3)));

        // combine with heavier weight on alert-match
        const decisionQuality = Math.round(Math.min(100, (alertMatchRatio * 100) * 0.65 + balanceScore * 0.35));

        // Response Timing & Prioritization (harsher timings)
        let avgResponseMs = 45000; // assume slower by default
        try {
            const responseTimes: number[] = [];
            alerts.forEach(a => {
                const firstAction = actionsHistory.find(act => (a.actionsTaken || []).includes(act.action));
                if (firstAction) responseTimes.push(firstAction.time - (a.createdAt || Date.now()));
            });
            if (responseTimes.length) avgResponseMs = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;
        } catch (err) { console.debug('computeScores: failed to compute avgResponseMs', err); }
        // penalize slower responses more aggressively (smaller divisor)
        let responseScore = Math.max(10, 100 - Math.min(120000, avgResponseMs) / 600);
        // reward handling of high severity within a short window but with reduced weight
        const highHandledRatio = alerts.length ? alerts.filter(a => a.severity === 'high' && (actionsHistory.find(h => (a.actionsTaken || []).includes(h.action))?.time ?? Infinity) - (a.createdAt ?? 0) < 15000).length / Math.max(1, alerts.filter(a => a.severity === 'high').length) : 0;
        responseScore = Math.round(responseScore * 0.8 + highHandledRatio * 100 * 0.2);

        // Governance & Operational Discipline (reworked)
        const authorizeCount = actionsHistory.filter(a => a.action === 'authorize-emergency').length;
        const escalateCount = actionsHistory.filter(a => a.action === 'escalate').length;
        const ackCount = actionsHistory.filter(a => a.action === 'acknowledge-ai').length;
        const totalActions = actionsHistory.length || 0;

        // Baseline is intentionally low when no operator activity occurred. Governance is earned by appropriate actions,
        // but severely penalizes emergency authorizations and excessive escalations.
        let governance = 30;
        // small bonus for being active (encourages measured engagement)
        governance += Math.min(30, totalActions * 2);
        // reward sensible acknowledgements a little (but do not over-reward)
        governance += Math.min(8, ackCount * 2);
        // heavy penalties for emergency authorizations and escalations (can quickly reduce governance)
        governance -= Math.min(72, authorizeCount * 12);
        governance -= Math.min(36, escalateCount * 6);
        // clamp
        governance = Math.max(0, Math.min(100, Math.round(governance)));

        // clamp scores
        const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
        const scores = {
            resilience: clamp(resilience),
            decision: clamp(decisionQuality),
            response: clamp(responseScore),
            governance: clamp(governance),
        };

        // weights: 5,4,3,3 -> normalized
        const weights = { resilience: 5 / 15, decision: 4 / 15, response: 3 / 15, governance: 3 / 15 };
        const total = Math.round(scores.resilience * weights.resilience + scores.decision * weights.decision + scores.response * weights.response + scores.governance * weights.governance);

        const categories = [
            { label: 'System Resilience (Core Outcome)', value: scores.resilience },
            { label: 'Decision Quality & Tradeoff Management', value: scores.decision },
            { label: 'Response Timing & Prioritization', value: scores.response },
            { label: 'Governance & Operational Discipline', value: scores.governance },
        ];

        return { categories, totalScore: total };
    };

    // use computed scores when finished; fallback to simple categories if not finished
    const finalScores = finished ? computeScores() : { categories: scoreCategories, totalScore: system.score };

    const handlePlayAgain = () => {
        // Close modal first
        setFinalModalOpen(false);

        // Clear timers created during actions
        if (actionTimersRef.current && actionTimersRef.current.length) {
            actionTimersRef.current.forEach(t => clearTimeout(t));
            actionTimersRef.current = [];
        }
        if (pqCooldownRef.current) {
            clearTimeout(pqCooldownRef.current);
            pqCooldownRef.current = null;
        }

        // reset global counters (optional)
        alertId = 0;
        actionId = 0;

        // reset all relevant state to initial values
        setAlerts([]);
        setActionsHistory([]);
        setMetrics([]);
        setSystem({
            stability: 100,
            trustLevel: 100,
            firmwareIntegrity: 100,
            certHealth: 100,
            networkHealth: 100,
            score: 0,
        });
        setStarted(false);
        setFinished(false);
        setActionInProgress({});
        setAuthorizedEmergency(false);
        setPqOnCooldown(false);
    };

    // open the final results modal when finished becomes true
    useEffect(() => {
        if (finished) setFinalModalOpen(true);
    }, [finished]);

    return (
        <div className={`app ${dashboardOpen ? 'dashboard-open' : ''}`}>
            {/* top-left hamburger to toggle side dashboard */}
            <button className="hamburger" aria-label="Open dashboard" onClick={() => setDashboardOpen(true)}>
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
            </button>

            <div className={`side-dashboard-backdrop ${dashboardOpen ? 'open' : ''}`} onClick={() => setDashboardOpen(false)} />
            <SideDashboard open={dashboardOpen} activeTab={dashboardActiveTab} onClose={() => { setDashboardOpen(false); setDashboardActiveTab(undefined); }} alerts={alerts} actions={actionsHistory} onResolve={resolveAlert} onEscalate={escalateAlert} onPerformAction={handlePerformAction} />

            <AlertHistoryDrawer open={alertHistoryOpen} onClose={() => setAlertHistoryOpen(false)} alerts={alerts} onResolve={resolveAlert} onEscalate={escalateAlert} />

            {!started ? (
                <TitlePage onStart={handleStart} />
            ) : (
                <>
                    <h1 style={{textAlign: 'center', marginBottom: 20}}>Q-READY: Post-Quantum Grid Incident Simulation</h1>

                    <div className="grid-row">
                        <MetricGraph data={metrics} />
                        <StatusPanel system={system} />
                    </div>

                    <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} hiddenAlertIds={hiddenAlertIds} />

                    {finished && <FinalScoreModal open={finalModalOpen} categories={finalScores.categories} totalScore={finalScores.totalScore} onPlayAgain={handlePlayAgain} onClose={() => setFinalModalOpen(false)} />}

                    <ActionPanel onAction={performAction} inProgress={actionInProgress} system={system} authorizedEmergency={authorizedEmergency} pqOnCooldown={pqOnCooldown} onAuthorize={() => setAuthorizedEmergency(true)} />
                </>
            )}
        </div>
    );
};

export default App;
