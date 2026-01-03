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

    // expanded (collapsible) alerts when embedded
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

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

    // keep expandedIds in-sync with current filtered alerts (remove ids no longer present)
    useEffect(() => {
        const ids = new Set(filtered.map(a => a.id));
        setExpandedIds(prev => prev.filter(id => ids.has(id)));
    }, [filtered]);

    // when selection changes in embedded mode, ensure the selected alert is expanded for visibility
    useEffect(() => {
        if (!embedded) return;
        if (selectedAlertId == null) return;
        setExpandedIds(prev => prev.includes(selectedAlertId as number) ? prev : [...prev, selectedAlertId as number]);
    }, [embedded, selectedAlertId]);

    const toggleExpand = (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // When the panel is opened (transition from closed -> open), default to expanding only the latest alert
    const prevOpenRef = React.useRef<boolean>(false);
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            // drawer just opened
            if (filtered.length > 0) {
                const latestId = filtered[0].id;
                setExpandedIds([latestId]);
                setSelectedAlertId(latestId);
                // scroll into view similarly to other logic
                setTimeout(() => {
                    const el = document.getElementById(`timeline-entry-${latestId}`);
                    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                setExpandedIds([]);
                setSelectedAlertId(null);
            }
        }
        prevOpenRef.current = open;
    }, [open, filtered]);

    return (
        <div className={`alert-history-drawer ${open ? 'open' : ''} ${embedded ? 'embedded' : ''}`} aria-hidden={!open}>
            <div className="drawer-header">
                 <div className="drawer-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* compact row: two modern-looking selects and the search input aligned on the same line */}
                    <select
                        value={filterStatus}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as 'all' | 'active' | 'resolved' | 'escalated' | 'unresolved')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.02)',
                            color: 'inherit',
                            fontSize: 13,
                            cursor: 'pointer',
                            minWidth: 120,
                        }}
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="escalated">Escalated</option>
                        <option value="unresolved">Unresolved</option>
                    </select>

                    <select
                        value={filterMetric}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterMetric(e.target.value as 'all' | 'Grid' | 'Crypto' | 'Firmware' | 'Network')}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.02)',
                            color: 'inherit',
                            fontSize: 13,
                            cursor: 'pointer',
                            minWidth: 140,
                        }}
                    >
                        <option value="all">All Metrics</option>
                        <option value="Grid">Grid</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Firmware">Firmware</option>
                        <option value="Network">Network</option>
                    </select>

                    <label
                        className="drawer-search-wrapper" htmlFor="drawer-search-input">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input id="drawer-search-input" className="drawer-search" placeholder="Search alerts" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search alerts" />
                    </label>
                 </div>

                <button className="drawer-close-x" aria-label="Close alert history" onClick={onClose}>×</button>
            </div>

            <div className="drawer-body">
                <div className="timeline">
                    {filtered.map(alert => {
                        // compute displayMetrics: prefer explicit affectedMetrics if they contain meaningful entries,
                        // otherwise infer from the message text.
                        const hasMeaningfulMetrics = (arr?: string[]) => {
                            if (!arr || arr.length === 0) return false;
                            return arr.some(x => !!x && !/no significant/i.test(x) && x.trim() !== '-');
                        };

                        const cleanedExplicit = (alert.affectedMetrics || []).map(x => (x || '').trim()).filter(Boolean);

                        const displayMetrics: string[] = hasMeaningfulMetrics(cleanedExplicit)
                            ? cleanedExplicit
                            : (() => {
                                const m = (alert.message || '').toLowerCase();
                                const res: string[] = [];
                                if (/cert|certificate|ca|crypto|cryptographic|crypt|handshake|auth|authentication/.test(m)) res.push('Crypto');
                                if (/firmware|signature/.test(m)) res.push('Firmware');
                                if (/network|latency|congestion|control(?:\s|-)?plane|control|config|configuration/.test(m)) res.push('Network');
                                if (/\bder\b|\bgrid\b/.test(m)) res.push('Grid');
                                return res;
                            })();

                        // Render a compact, card-like layout when embedded so it matches actions UI
                        if (embedded) {
                            return (
                             <div
                                  id={`timeline-entry-${alert.id}`}
                                  key={alert.id}
                                  className={`timeline-entry ${alert.status} ${selectedAlertId === alert.id ? 'selected' : ''}`}
                                  onClick={() => setSelectedAlertId(alert.id)}
                                  style={{ position: 'relative', marginBottom: 12, padding: 10, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.03)' }}
                              >
                                  {/* absolute left severity bar - spans between the card padding */}
                                  {(() => {
                                      const color = alert.severity === 'high' ? '#ff6b6b' : alert.severity === 'medium' ? '#ffb86b' : '#6ee7b7';
                                      // span full card height so there are no gaps at the top/bottom
                                      return <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: color }} />;
                                  })()}

                                  <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                                      {/* content column */}
                                      <div style={{ flex: 1 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                  <button
                                                      onClick={(e) => toggleExpand(alert.id, e)}
                                                      aria-expanded={expandedIds.includes(alert.id)}
                                                      aria-controls={`timeline-entry-body-${alert.id}`}
                                                      className="alert-toggle"
                                                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                  >
                                                      {expandedIds.includes(alert.id) ? '▾' : '▸'}
                                                  </button>

                                                  <div style={{ fontWeight: 700 }}>{alert.message}</div>
                                              </div>
                                              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(alert.createdAt).toLocaleTimeString()}</div>
                                          </div>

                                          {expandedIds.includes(alert.id) && (
                                              <div id={`timeline-entry-body-${alert.id}`} style={{ marginTop: 8 }}>
                                                  {alert.aiDescription && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alert.aiDescription}</div>}

                                                  <div style={{ marginTop: 8 }}>
                                                      <div style={{ fontWeight: 600 }}>Affected Metrics:</div>
                                                      <ul style={{ marginTop: 6, marginBottom: 6 }}>
                                                          {displayMetrics.length === 0 ? (
                                                              alert.status === 'active' ? (
                                                                  <li style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                                                                      <span className="spinner" style={{ marginRight: 8 }} aria-hidden="true" />
                                                                      <span>Pending...</span>
                                                                  </li>
                                                              ) : (
                                                                  <li style={{ color: 'var(--text-secondary)' }}>-</li>
                                                              )
                                                          ) : (
                                                              displayMetrics.map((m, i) => (
                                                                  <li key={i} style={{ color: 'var(--text-primary)' }}>{m}</li>
                                                              ))
                                                          )}
                                                      </ul>
                                                  </div>

                                                  <div>
                                                      <div style={{ fontWeight: 600 }}>Recommended:</div>
                                                      <div style={{ marginTop: 6 }}>{alert.recommendedAction}</div>
                                                  </div>

                                                  <div className="entry-actions" style={{ marginTop: 8 }}>
                                                      {alert.status === 'active' && (
                                                          <>
                                                              <button className="btn-resolve" onClick={(e) => { e.stopPropagation(); onResolve(alert.id, 'Operator resolved', 'Partially mitigated'); }}>Mark Resolved</button>
                                                              <button className="btn-escalate" onClick={(e) => { e.stopPropagation(); onEscalate(alert.id); }}>Escalate</button>
                                                          </>
                                                      )}

                                                      {alert.status !== 'active' && (
                                                          <div className="resolution">
                                                              <small>Resolved: {alert.resolutionTimestamp ? new Date(alert.resolutionTimestamp).toLocaleString() : '-'}</small>
                                                              <div>{alert.resolutionSummary}</div>
                                                              <div>{alert.confidence}</div>
                                                          </div>
                                                      )}

                                                      <div className="metric-snapshots" style={{ marginTop: 8 }}>
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
                                          )}
                                      </div>
                                  </div>
                              </div>
                            );
                        } else {
                            return (
                              // keep original timeline layout for non-embedded mode
                              <div id={`timeline-entry-${alert.id}`} key={alert.id} className={`timeline-entry ${alert.status} ${selectedAlertId === alert.id ? 'selected' : ''}`} onClick={() => setSelectedAlertId(alert.id)}>
                                  <div className="entry-meta">
                                      <div className="severity">{alert.severity.toUpperCase()}</div>
                                      <div className="time">{new Date(alert.createdAt).toLocaleString()}</div>
                                      <div className="status" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          {alert.status === 'active' ? (
                                              <>
                                                  <span className="spinner" />
                                                  <span>{alert.status.toUpperCase()}</span>
                                              </>
                                          ) : (
                                              alert.status.toUpperCase()
                                          )}
                                      </div>
                                   </div>
                                   <div className="entry-body">
                                       <strong>{alert.message}</strong>
                                       <p style={{ color: 'var(--text-secondary)' }}>{alert.aiDescription}</p>
                                       <p>
                                          <em>Affected:</em>{' '}
                                          {displayMetrics.length === 0 ? (
                                              alert.status === 'active' ? (
                                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}><span className="spinner" />Pending...</span>
                                              ) : (
                                                  <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                              )
                                          ) : (
                                              displayMetrics.join(', ')
                                          )}
                                       </p>
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
                            );
                          }
                     })}

                    {filtered.length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No alerts match the filters</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertHistoryDrawer;

