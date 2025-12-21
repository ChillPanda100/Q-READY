import React from 'react';
import type {Alert} from '../types';

interface Props {
    alerts: Alert[];
    onAcknowledge: (id: number) => void;
}

const AlertsPanel: React.FC<Props> = ({ alerts, onAcknowledge }) => {
    return (
        <div className="alerts-container">
            {alerts.map(alert => (
                <div
                    key={alert.id}
                    className={`alert-card ${alert.severity} ${
                        alert.acknowledged ? 'acknowledged' : ''
                    }`}
                >
                    <strong>{alert.severity.toUpperCase()}</strong>
                    <p>{alert.message}</p>
                    <small>{alert.recommendedAction}</small>

                    {!alert.acknowledged && (
                        <button onClick={() => onAcknowledge(alert.id)}>
                            Acknowledge
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AlertsPanel;
