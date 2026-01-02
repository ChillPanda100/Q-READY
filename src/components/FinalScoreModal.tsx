import React, {useEffect, useState} from 'react';

type Category = { label: string; value: number };

const metricDescriptions: Record<string, string> = {
    'System Resilience (Core Outcome)': `What it measures: Whether the energy system survived the incident with acceptable degradation. Based on grid stability staying above critical failure thresholds, avoidance of cascading DER outages, and ability to recover degraded metrics by scenario end.

Why this matters: In real-world energy operations, resilience is more important than optimization. A degraded but operating grid is a success.`,
    'Decision Quality & Tradeoff Management': `What it measures: How well the operator selected actions given competing risks. Based on choosing actions aligned with the alert domain, accepting short-term losses for long-term stability, avoiding gaming a single metric, and understanding side effects.

Why this matters: There is no perfect response since there are informed tradeoffs.`,
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

    // Generate concise feedback based on the component scores and total
    const computeFeedback = (cats: Category[], total: number) => {
        const conclusion = (() => {
            if (total >= 85) return 'Excellent - strong performance.';
            if (total >= 70) return 'Good - solid decisions with room for polish.';
            if (total >= 50) return 'Fair - some important gaps to address.';
            return 'Needs improvement: focus on core resilience and prioritization.';
        })();

        const tips: string[] = [];

        // Per-metric targeted advice
        const find = (labelPart: string) => cats.find(c => c.label.toLowerCase().includes(labelPart.toLowerCase()));

        const resilience = find('Resilience');
        if (resilience && resilience.value < 60) {
            tips.push('System Resilience: work to prevent deep stability dips and recover metrics before scenario end (e.g., use safe containment actions, staged recovery).');
        } else if (resilience && resilience.value < 80) {
            tips.push('System Resilience: good, but ensure you monitor for cascading failures and plan staged recoveries.');
        }

        const decision = find('Decision Quality');
        if (decision && decision.value < 60) {
            tips.push('Decision Quality: align actions to alert domains and weigh short-term losses against long-term stability; avoid repeatedly optimizing a single metric.');
        } else if (decision && decision.value < 80) {
            tips.push('Decision Quality: generally good; keep balancing tradeoffs across metrics when possible.');
        }

        const response = find('Response Timing');
        if (response && response.value < 60) {
            tips.push('Response Timing: act faster on high-severity alerts; prioritize preventing stacking/cascades over low-value interventions.');
        } else if (response && response.value < 80) {
            tips.push('Response Timing: acceptable, focus on reducing average response time and prioritizing high-severity incidents.');
        }

        const gov = find('Governance');
        if (gov && gov.value < 60) {
            tips.push('Governance: avoid excessive emergency authorizations and escalations; use acknowledgements and human-in-the-loop checks appropriately.');
        } else if (gov && gov.value < 80) {
            tips.push('Governance: mostly good, keep authority use controlled and documented.');
        }

        // If no specific tips and high total, add a positive reinforcement
        if (tips.length === 0) {
            tips.push('Keep doing what you did: balanced actions, timely responses, and controlled governance led to this result.');
        }

        // Short, actionable next steps when score is low
        if (total < 50) {
            tips.push('Next steps: run focused drills on containment & recovery, practice prioritizing high-severity alerts, and limit emergency-authorize use unless clearly necessary.');
        }

        return { conclusion, tips };
    };

    const feedback = computeFeedback(categories, totalScore);

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

                    {/* Feedback section: conclusion + actionable tips */}
                    <div className="feedback-card" style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid var(--border-soft)' }}>
                        <strong style={{ display: 'block', marginBottom: 8 }}>{feedback.conclusion}</strong>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {feedback.tips.map((t, i) => (
                                <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{t}</li>
                            ))}
                        </ul>
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
