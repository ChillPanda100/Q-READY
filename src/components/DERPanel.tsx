import React from 'react';
import type { SystemState } from '../types';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
}

const DERPanel: React.FC<Props> = ({ onAction, inProgress = {}, system }) => {
    const sys = system ?? { stability: 100 } as SystemState;
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
            <h3>DER / Grid Operations</h3>
            <div>
                {btn('limit', 'Limit DER Autonomy', { title: 'Grid Stability ↑ — Tradeoff: reduced DER efficiency' })}
                {btn('reboot', 'Reboot Affected DERs', { title: 'Grid Stability ↑↑ — Tradeoff: Firmware Integrity ↓, Network Health ↓ (temporary)' })}
                {btn('isolate-segment', 'Isolate Compromised DER Segment', { title: 'Grid Stability ↑ — Tradeoff: localized network health ↓ and capacity loss' })}
                {btn('restore-autonomy', 'Restore DER Autonomy', { disabled: (sys.stability ?? 0) < 80, title: 'Restores autonomy; may reduce stability if done too early. Requires system stability ≥ 80' })}
            </div>
        </div>
    );
};

export default DERPanel;

