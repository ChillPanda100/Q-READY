import React from 'react';
import type { ActionRecord } from '../types';

interface Props {
    actions: ActionRecord[];
}

const deltaRegex = /^(.*):\s*([+-]?\d+)$/;

const ActionHistoryPanel: React.FC<Props> = ({ actions }) => {
    return (
        <div style={{ padding: 8 }}>
            {actions.length === 0 && (
                <div style={{ padding: 16, color: 'var(--text-secondary)' }}>No actions recorded yet</div>
            )}

            {actions.map(a => {
                const inProgress = a.results && a.results.some(r => r.includes('In progress'));
                const completed = a.results && a.results.some(r => r.startsWith('✔'));

                // Prefer explicit affectedMetrics, otherwise parse deltas out of results if present
                const deltas: string[] = (a.affectedMetrics && a.affectedMetrics.length > 0)
                    ? a.affectedMetrics
                    : (a.results || []).filter(r => deltaRegex.test(r));

                // Only show standardized status under Results: either In progress or ✔ Completed
                let statusLabel: string | null = null;
                if (inProgress) {
                    statusLabel = 'In progress...';
                } else if (completed) {
                    statusLabel = '✔ Completed';
                }

                return (
                    <div key={a.id} style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{a.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(a.time).toLocaleTimeString()}</div>
                                <div style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: inProgress ? 'rgba(255,255,255,0.02)' : 'rgba(0,255,128,0.06)', color: inProgress ? 'var(--text-secondary)' : 'var(--accent-green)' }}>{inProgress ? 'In progress' : (completed ? 'Success' : 'Completed')}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Triggered By: {a.triggeredBy}</div>

                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontWeight: 600 }}>Affected Metrics:</div>
                                <ul style={{ marginTop: 6, marginBottom: 6 }}>
                                    {deltas.length > 0 ? (
                                        deltas.map((m, i) => {
                                            const match = deltaRegex.exec(m.trim());
                                            if (match) {
                                                const name = match[1];
                                                const val = parseInt(match[2], 10);
                                                const color = val > 0 ? 'var(--accent-green)' : 'var(--accent-red)';
                                                const sign = val > 0 ? '+' : '';
                                                return <li key={i} style={{ color }}>{name}: {sign}{val}</li>;
                                            }

                                            return <li key={i} style={{ color: 'var(--text-primary)' }}>{m}</li>;
                                        })
                                    ) : (
                                        <li style={{ color: 'var(--text-secondary)' }}>{inProgress ? 'Pending...' : 'No significant metric changes'}</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <div style={{ fontWeight: 600 }}>Result:</div>
                                <ul style={{ marginTop: 6 }}>
                                    {statusLabel ? (
                                        <li style={{ color: statusLabel.startsWith('✔') ? 'var(--accent-green)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {inProgress && (
                                                <span className="spinner" aria-hidden="true" />
                                            )}

                                            <span>{statusLabel}</span>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActionHistoryPanel;
