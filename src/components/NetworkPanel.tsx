import React from 'react';
import type { SystemState } from '../types';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
}

const NetworkPanel: React.FC<Props> = ({ onAction, inProgress = {} }) => {
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
            <h3>Network Operations</h3>
            <div>
                {btn('mitigate-network', 'Mitigate Network Traffic', { title: 'Network Health ↑↑ — Grid Stability ↑' })}
                {btn('segment-network', 'Segment DER Network', { title: 'Network Health ↑ — Tradeoff: Grid Stability ↓ (capacity loss)' })}
                {btn('restore-routing', 'Restore Network Routing', { title: 'Network Health ↑ — Use when threat contained' })}
            </div>
        </div>
    );
};

export default NetworkPanel;
