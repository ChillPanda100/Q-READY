import React from 'react';

interface MinimalSystem {
    firmwareIntegrity?: number;
}

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: MinimalSystem;
    authorizedEmergency?: boolean;
}

const FirmwarePanel: React.FC<Props> = ({ onAction, inProgress = {}, system, authorizedEmergency = false }) => {
    const sys = system ?? { firmwareIntegrity: 100 };
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
            <h3>Firmware & Device Integrity</h3>
            <div>
                {btn('patch', 'Apply Firmware Patch', { disabled: (sys.firmwareIntegrity ?? 0) >= 99, title: 'Firmware Integrity ↑↑ — May cause reboots and temporary stability drop' })}
                {btn('verify-signatures', 'Verify Firmware Signatures', { title: 'Firmware Integrity ↑ — Low risk' })}
                {btn('rollback', 'Rollback Firmware Version', { disabled: !authorizedEmergency, title: 'Emergency-only: may restore integrity but can cause Grid Stability ↓↓' })}
            </div>
        </div>
    );
};

export default FirmwarePanel;
