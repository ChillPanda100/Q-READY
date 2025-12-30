import React from 'react';
import type { SystemState } from '../types';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
    authorizedEmergency?: boolean;
    pqOnCooldown?: boolean;
    onAuthorize?: () => void;
}

const ActionPanel: React.FC<Props> = ({ onAction, inProgress = {} }) => {
    const busy = (a: string) => !!inProgress[a];

    const btn = (action: string, label: string) => (
        <button onClick={() => onAction(action)} disabled={busy(action)} aria-busy={busy(action)}>
            {label}
            {busy(action) && <span className="spinner" aria-hidden="true" />}
        </button>
    );

    return (
        <div className="panel">
            <h2>Operator Actions</h2>
            {btn('rotate', 'Rotate Keys')}
            {btn('limit', 'Limit DER Autonomy')}
            {btn('escalate', 'Escalate Incident')}
            <div style={{marginTop: 10}}>
                {btn('patch', 'Apply Firmware Patch')}
                {btn('renew', 'Renew Certificates')}
                {btn('mitigate-network', 'Mitigate Network')}
                {btn('reboot', 'Reboot Affected DERs')}
            </div>
        </div>
    );
};

export default ActionPanel;
