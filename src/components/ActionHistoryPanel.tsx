import React from 'react';
import type { ActionRecord } from '../types';

interface Props {
    actions: ActionRecord[];
}

const ActionHistoryPanel: React.FC<Props> = ({ actions }) => {
    return (
        <div style={{ padding: 8 }}>
            {actions.length === 0 && (
                <div style={{ padding: 16, color: 'var(--text-secondary)' }}>No actions recorded yet</div>
            )}

            {actions.map(a => (
                <div key={a.id} style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{a.label}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(a.time).toLocaleTimeString()}</div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Triggered By: {a.triggeredBy}</div>

                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontWeight: 600 }}>Affected Metrics:</div>
                            <ul style={{ marginTop: 6, marginBottom: 6 }}>
                                {a.affectedMetrics.map((m, i) => (
                                    <li key={i} style={{ color: 'var(--text-primary)' }}>{m}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <div style={{ fontWeight: 600 }}>Result:</div>
                            <ul style={{ marginTop: 6 }}>
                                {a.results.map((r, i) => (
                                    <li key={i} style={{ color: r.startsWith('✔') ? 'var(--accent-green)' : 'var(--text-primary)' }}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActionHistoryPanel;

