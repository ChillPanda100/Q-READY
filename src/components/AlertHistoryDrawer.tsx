import React, {useMemo, useState} from 'react';
import type {Alert} from '../types';

interface Props {
    open: boolean;
    onClose: () => void;
    alerts: Alert[];
    onResolve: (id: number, summary: string, confidence: string) => void;
    onEscalate: (id: number, note?: string) => void;
    embedded?: boolean;
}

const AlertHistoryDrawer: React.FC<Props> = ({ open, onClose, alerts, onResolve, onEscalate, embedded = false }) => {
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'escalated' | 'unresolved'>('all');
    const [filterMetric, setFilterMetric] = useState<'all' | 'Grid' | 'Crypto' | 'Firmware' | 'Network'>('all');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        return alerts.filter(a => {
            if (filterStatus !== 'all' && a.status !== filterStatus) return false;
            if (filterMetric !== 'all' && !(a.affectedMetrics || []).includes(filterMetric)) return false;
            if (search.trim()) {
                const s = search.toLowerCase();
                if (!(`${a.message} ${a.aiDescription || ''} ${a.recommendedAction}`.toLowerCase().includes(s))) return false;
            }
            return true;
        }).sort((x, y) => (y.createdAt - x.createdAt));
    }, [alerts, filterStatus, filterMetric, search]);

    return (
        <div className={`alert-history-drawer ${open ? 'open' : ''} ${embedded ? 'embedded' : ''}`} aria-hidden={!open}>
            <div className="drawer-header">
                <div className="drawer-title">
                    <h3>Alert History</h3>
                    <div className="drawer-sub">Forensics & Post-incident Review</div>
                </div>

                <div className="drawer-controls">
                    <select value={filterStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as 'all' | 'active' | 'resolved' | 'escalated' | 'unresolved')}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="escalated">Escalated</option>
                        <option value="unresolved">Unresolved</option>
                    </select>

                    <select value={filterMetric} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterMetric(e.target.value as 'all' | 'Grid' | 'Crypto' | 'Firmware' | 'Network')}>
                        <option value="all">All Metrics</option>
                        <option value="Grid">Grid</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Firmware">Firmware</option>
                        <option value="Network">Network</option>
                    </select>

                    <input className="drawer-search" placeholder="Search alerts" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <button className="drawer-close-x" aria-label="Close alert history" onClick={onClose}>×</button>
            </div>

            <div className="drawer-body">
                <div className="timeline">
                    {filtered.map(alert => (
                        <div key={alert.id} className={`timeline-entry ${alert.status}`}>
                            <div className="entry-meta">
                                <div className="severity">{alert.severity.toUpperCase()}</div>
                                <div className="time">{new Date(alert.createdAt).toLocaleString()}</div>
                                <div className="status">{alert.status.toUpperCase()}</div>
                            </div>
                            <div className="entry-body">
                                <strong>{alert.message}</strong>
                                <p style={{ color: 'var(--text-secondary)' }}>{alert.aiDescription}</p>
                                <p><em>Affected:</em> {alert.affectedMetrics.join(', ')}</p>
                                <p><em>Recommended:</em> {alert.recommendedAction}</p>

                                <div className="entry-actions">
                                    {alert.status === 'active' && (
                                        <>
                                            <button className="btn-resolve" onClick={() => onResolve(alert.id, 'Operator resolved', 'Partially mitigated')}>Mark Resolved</button>
                                            <button className="btn-escalate" onClick={() => onEscalate(alert.id)}>Escalate</button>
                                        </>
                                    )}

                                    {alert.status !== 'active' && (
                                        <div className="resolution">
                                            <small>Resolved: {alert.resolutionTimestamp ? new Date(alert.resolutionTimestamp).toLocaleString() : '-'}</small>
                                            <div>{alert.resolutionSummary}</div>
                                            <div>{alert.confidence}</div>
                                        </div>
                                    )}

                                    <div className="metric-snapshots">
                                        {alert.metricSnapshots && alert.metricSnapshots.map(s => (
                                            <div key={s.time} className="snapshot">
                                                <small>{new Date(s.time).toLocaleTimeString()}</small>
                                                <div>Stability: {s.stability}</div>
                                                <div>Trust: {s.trust}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No alerts match the filters</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertHistoryDrawer;
