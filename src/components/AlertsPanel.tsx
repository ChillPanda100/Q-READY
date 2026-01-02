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

const AlertsPanel: React.FC<Props> = ({ alerts }: Props) => {
    const [closingIds, setClosingIds] = useState<number[]>([]);
    const [collapsedIds, setCollapsedIds] = useState<number[]>([]);
    const [dismissedIds, setDismissedIds] = useState<number[]>([]);
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

        // After collapse, mark this alert as dismissed for this view only (do NOT call onAcknowledge)
        // so the alert remains in the alert history (parent state) unchanged.
        const t2 = window.setTimeout(() => {
            setDismissedIds(prev => [...prev, id]);
            // simply remove the ids from our local tracking so the DOM entry can be
            // fully removed from this component's render (collapsed animation finished)
            setClosingIds(prev => prev.filter(x => x !== id));
            setCollapsedIds(prev => prev.filter(x => x !== id));
        }, TOTAL_MS);

        timersRef.current.push(t1, t2);
    };

    const visible = alerts.filter(alert => !dismissedIds.includes(alert.id));

    return (
        <div className="alerts-container">
            {visible.slice().reverse().map(alert => (
                <div
                    key={alert.id}
                    className={`alert-card ${alert.severity} ${
                        closingIds.includes(alert.id) ? 'closing' : ''
                    } ${collapsedIds.includes(alert.id) ? 'collapsed' : ''}`}
                >
                    <strong>{alert.severity.toUpperCase()}</strong>
                    <p>{alert.message}</p>
                    <small>{alert.recommendedAction}</small>

                    {/* replace inline Acknowledge button with a compact top-right close */}
                    {!closingIds.includes(alert.id) && (
                        <button
                            className="alert-close-x"
                            aria-label={`Dismiss alert ${alert.id}`}
                            title="Dismiss"
                            onClick={() => handleAcknowledge(alert.id)}
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AlertsPanel;
