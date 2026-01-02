import React, {useEffect, useState} from 'react';

type Category = { label: string; value: number };

const metricDescriptions: Record<string, string> = {
    'System Resilience (Core Outcome)': `What it measures: Whether the energy system survived the incident with acceptable degradation. Based on grid stability staying above critical failure thresholds, avoidance of cascading DER outages, and ability to recover degraded metrics by scenario end.

Why this matters: In real-world energy operations, resilience beats optimization. A degraded but operating grid is a success.`,
    'Decision Quality & Tradeoff Management': `What it measures: How well the operator selected actions given competing risks. Based on choosing actions aligned with the alert domain, accepting short-term losses for long-term stability, avoiding gaming a single metric, and understanding side effects.

Why this matters: There is no perfect response — only informed tradeoffs.`,
    'Response Timing & Prioritization': `What it measures: How effectively the operator handled when and what to respond to. Based on time to first meaningful action after alerts, addressing high-severity threats first, and preventing alert stacking and escalation.

Why this matters: Late correct actions can be worse than early imperfect ones.`,
    'Governance & Operational Discipline': `What it measures: Proper use of authority, escalation, and human oversight. Based on appropriate escalation of major incidents, controlled use of emergency actions, acknowledging AI alerts without over-reliance, and maintaining human-in-the-loop control.

Why this matters: Critical infrastructure is governed by people, not just technology.`,
};

const FinalScoreModal: React.FC<{
    open: boolean;
    categories: Category[];
    totalScore: number;
    onPlayAgain: () => void;
    onClose: () => void;
}> = ({ open, categories, totalScore, onPlayAgain, onClose }) => {
    const [infoOpen, setInfoOpen] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Simulation results">
            <div className="modal-card">
                <button className="modal-close-x" aria-label="Close results" onClick={onClose}>×</button>
                <h2>Simulation Results</h2>
                <p className="modal-sub">How you performed across scoring categories</p>

                <div className="modal-body">
                    {categories.map(c => (
                        <div key={c.label} className="score-row">
                            <div className="score-row-label" style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <strong>{c.label}</strong>
                                    <button
                                        aria-expanded={infoOpen === c.label}
                                        aria-controls={`info-${c.label.replace(/[^a-z0-9]/gi, '-')}`}
                                        onClick={() => setInfoOpen(prev => prev === c.label ? null : c.label)}
                                        title={`More information about ${c.label}`}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            padding: 0,
                                        }}
                                    >
                                        i
                                    </button>
                                </div>

                                <span className="score-value">{Math.round(c.value)}</span>
                            </div>

                            <div className="progress" aria-hidden>
                                <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, c.value))}%` }} />
                            </div>

                            {infoOpen === c.label && (
                                <div id={`info-${c.label.replace(/[^a-z0-9]/gi, '-')}`} className="metric-info" style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.92rem', lineHeight: 1.35 }}>
                                    { (metricDescriptions[c.label] ?? 'More information about this metric is not available.').split('\n\n').map((para, idx) => (
                                        <p key={idx} style={{ margin: '6px 0' }}>{para}</p>
                                    )) }
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="total-score" style={{ textAlign: 'center' }}>
                        <h3>Total Score</h3>
                        <div className="total-value" style={{ margin: '6px auto', textAlign: 'center' }}>{Math.round(totalScore)}</div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={onPlayAgain} aria-label="Play simulation again">Play again</button>
                </div>
            </div>
        </div>
    );
};

export default FinalScoreModal;
