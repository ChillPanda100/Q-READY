import React, {useMemo, useState, useEffect} from 'react';
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
    // default status filter when embedded should show active alerts first
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'escalated' | 'unresolved'>(() => embedded ? 'active' : 'all');
    const [filterMetric, setFilterMetric] = useState<'all' | 'Grid' | 'Crypto' | 'Firmware' | 'Network'>('all');
    const [search, setSearch] = useState('');

    // selected alert id for focus/highlight inside embedded dashboard
    const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

    // severity ordering: lower number = higher priority
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

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

    // when the drawer opens in embedded mode, pick the first active alert as selected
    useEffect(() => {
        if (!embedded) return;
        if (!open) return;

        // prefer the highest-severity active alert (then newest)
        const activeAlerts = alerts.filter(a => a.status === 'active').slice().sort((a, b) => {
            const s = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
            if (s !== 0) return s;
            return b.createdAt - a.createdAt;
        });

        const firstActive = activeAlerts[0];
        if (firstActive) {
            setSelectedAlertId(firstActive.id);
            // scroll into view after render
            setTimeout(() => {
                const el = document.getElementById(`timeline-entry-${firstActive.id}`);
                if (el && typeof (el.scrollIntoView) === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        } else if (filtered.length > 0) {
            // fallback to first filtered alert (choose highest-severity among filtered)
            const filtSorted = filtered.slice().sort((a, b) => {
                const s = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
                if (s !== 0) return s;
                return b.createdAt - a.createdAt;
            });
            setSelectedAlertId(filtSorted[0].id);
            setTimeout(() => {
                const el = document.getElementById(`timeline-entry-${filtSorted[0].id}`);
                if (el && typeof (el.scrollIntoView) === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        } else {
            setSelectedAlertId(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [embedded, open, alerts]);

    // when filters change and embedded, keep selection on the first visible active alert
    useEffect(() => {
        if (!embedded || !open) return;
        // prefer highest-severity active among filtered, otherwise first filtered
        const activeInFiltered = filtered.filter(a => a.status === 'active');
        const pickList = (activeInFiltered.length ? activeInFiltered : filtered).slice();
        const first = pickList.sort((a, b) => {
            const s = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
            if (s !== 0) return s;
            return b.createdAt - a.createdAt;
        })[0];
        if (first) {
            setSelectedAlertId(first.id);
            setTimeout(() => {
                const el = document.getElementById(`timeline-entry-${first.id}`);
                if (el && typeof (el.scrollIntoView) === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        } else {
            setSelectedAlertId(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered.length, embedded, open]);

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
                        <div id={`timeline-entry-${alert.id}`} key={alert.id} className={`timeline-entry ${alert.status} ${selectedAlertId === alert.id ? 'selected' : ''}`} onClick={() => setSelectedAlertId(alert.id)}>
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
