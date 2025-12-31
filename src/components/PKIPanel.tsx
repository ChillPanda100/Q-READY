import React from 'react';
import type { SystemState } from '../types';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
    authorizedEmergency?: boolean;
    pqOnCooldown?: boolean;
}

const PKIPanel: React.FC<Props> = ({ onAction, inProgress = {}, system, authorizedEmergency = false, pqOnCooldown = false }) => {
    const sys = system ?? { certHealth: 100 } as SystemState;
    const busy = (a: string) => !!inProgress[a];
    const btn = (action: string, label: string, opts: { disabled?: boolean; title?: string } = {}) => (
        <button
            key={action}
            onClick={() => onAction(action)}
            disabled={busy(action) || !!opts.disabled}
            title={opts.title}
            aria-busy={busy(action)}
            style={{margin: 4, padding: '6px 10px', fontSize: '0.85rem'}}
        >
            {label}
            {busy(action) && <span className="spinner" aria-hidden="true" />}
        </button>
    );

    return (
        <div className="panel" style={{display:'flex', flexDirection:'column'}}>
            <h3 style={{marginTop:0}}>Cryptographic & Key Management (PKI)</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {btn('rotate', 'Rotate Cryptographic Keys', { disabled: (sys.certHealth ?? 0) < 70, title: 'Requires Certificate Health ≥ 70% (temporary network handshake failures)' })}
                {btn('renew', 'Renew Certificates', { title: 'Certificate Health ↑↑ — Improves trust; requires DER connectivity' })}
                {btn('enforce-pq', 'Enforce Post-Quantum Mode', { disabled: pqOnCooldown || !authorizedEmergency, title: pqOnCooldown ? 'On cooldown' : !authorizedEmergency ? 'Requires emergency authorization' : 'High-impact: Network Health ↓↓; cooldown enforced' })}
            </div>
        </div>
    );
};

export default PKIPanel;
