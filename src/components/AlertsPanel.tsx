import React, {useState, useRef, useEffect} from 'react';
import type {Alert} from '../types';

interface Props {
    alerts: Alert[];
    onAcknowledge: (id: number) => void;
}

// Timings are split to first slide horizontally, then collapse height so
// neighboring alerts animate downward smoothly. Keep these in sync with CSS.
const SLIDE_MS = 260;
const COLLAPSE_MS = 160;
const TOTAL_MS = SLIDE_MS + COLLAPSE_MS;

const AlertsPanel: React.FC<Props> = ({ alerts, onAcknowledge }) => {
    const [closingIds, setClosingIds] = useState<number[]>([]);
    const [collapsedIds, setCollapsedIds] = useState<number[]>([]);
    const timersRef = useRef<number[]>([]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            // use the snapshot of timers captured above
            timers.slice().forEach(t => clearTimeout(t));
        };
    }, []);

    const handleAcknowledge = (id: number) => {
        if (closingIds.includes(id)) return; // already in progress

        // Phase 1: mark as closing to trigger horizontal slide (transform/opacity)
        setClosingIds(prev => [...prev, id]);

        // After the slide finishes, collapse height/padding to allow other alerts to slide down
        const t1 = window.setTimeout(() => {
            setCollapsedIds(prev => [...prev, id]);
        }, SLIDE_MS);

        // After collapse, notify parent to remove the alert from state
        const t2 = window.setTimeout(() => {
            onAcknowledge(id);
            setClosingIds(prev => prev.filter(x => x !== id));
            setCollapsedIds(prev => prev.filter(x => x !== id));
        }, TOTAL_MS);

        timersRef.current.push(t1, t2);
    };

    return (
        <div className="alerts-container">
            {alerts.map(alert => (
                <div
                    key={alert.id}
                    className={`alert-card ${alert.severity} ${
                        closingIds.includes(alert.id) ? 'closing' : ''
                    } ${collapsedIds.includes(alert.id) ? 'collapsed' : ''}`}
                >
                    <strong>{alert.severity.toUpperCase()}</strong>
                    <p>{alert.message}</p>
                    <small>{alert.recommendedAction}</small>

                    {!closingIds.includes(alert.id) && (
                        <button onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AlertsPanel;
