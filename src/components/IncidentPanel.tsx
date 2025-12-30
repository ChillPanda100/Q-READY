import React from 'react';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    authorizedEmergency?: boolean;
    onAuthorize?: () => void;
}

const IncidentPanel: React.FC<Props> = ({ onAction, inProgress = {}, authorizedEmergency = false, onAuthorize }) => {
    const busy = (a: string) => !!inProgress[a];
    const btn = (action: string, label: string, opts: { disabled?: boolean; title?: string } = {}) => (
        <button
            key={action}
            onClick={() => onAction(action)}
            disabled={busy(action) || !!opts.disabled}
            title={opts.title}
            aria-busy={busy(action)}
            style={{marginRight:8, marginBottom:8}}
        >
            {label}
            {busy(action) && <span className="spinner" aria-hidden="true" />}
        </button>
    );

    return (
        <div className="panel">
            <h3>Incident Command & Governance</h3>
            <div>
                {btn('escalate', 'Escalate Incident', { title: 'Escalation: no direct metric change' })}
                {btn('acknowledge-ai', 'Acknowledge AI Alert', { title: 'Acknowledge and reduce alert pressure' })}
                {onAuthorize ? (
                    <button onClick={() => onAuthorize()} title="Authorize emergency actions">{authorizedEmergency ? 'Emergency Authorized' : 'Authorize Emergency Actions'}</button>
                ) : (
                    btn('authorize-emergency', authorizedEmergency ? 'Emergency Authorized' : 'Authorize Emergency Actions', { title: 'Authorize emergency actions' })
                )}
            </div>
        </div>
    );
};

export default IncidentPanel;

