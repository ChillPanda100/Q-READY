import React from 'react';
import type { SystemState } from '../types';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
}

const NetworkPanel: React.FC<Props> = ({ onAction, inProgress = {} }: Props) => {
    // `system` is accepted by the Props interface but intentionally not destructured here
    // to avoid unused-variable lint errors; callers may still pass it.
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
            <h3 style={{marginTop:0}}>Network Operations</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {btn('mitigate-network', 'Mitigate Network Traffic', { title: 'Network Health ↑↑ — Grid Stability ↑' })}
                {btn('segment-network', 'Segment DER Network', { title: 'Network Health ↑ — Tradeoff: Grid Stability ↓ (capacity loss)' })}
                {btn('restore-routing', 'Restore Network Routing', { title: 'Network Health ↑ — Use when threat contained' })}
            </div>
        </div>
    );
};

export default NetworkPanel;
