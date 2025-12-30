import React from 'react';
import type { SystemState } from '../types';
import DERPanel from './DERPanel';
import PKIPanel from './PKIPanel';
import FirmwarePanel from './FirmwarePanel';
import NetworkPanel from './NetworkPanel';
import IncidentPanel from './IncidentPanel';

interface Props {
    onAction: (action: string) => void;
    inProgress?: Record<string, boolean>;
    system?: SystemState;
    authorizedEmergency?: boolean;
    pqOnCooldown?: boolean;
    onAuthorize?: () => void;
}

const ActionPanel: React.FC<Props> = ({ onAction, inProgress = {}, system, authorizedEmergency = false, pqOnCooldown = false, onAuthorize }) => {
    return (
        <div className="panel action-panel">
            <h2>Operator Actions</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12}}>
                <DERPanel onAction={onAction} inProgress={inProgress} system={system} />
                <PKIPanel onAction={onAction} inProgress={inProgress} system={system} authorizedEmergency={authorizedEmergency} pqOnCooldown={pqOnCooldown} />
                <FirmwarePanel onAction={onAction} inProgress={inProgress} system={system} authorizedEmergency={authorizedEmergency} />
                <NetworkPanel onAction={onAction} inProgress={inProgress} system={system} />
                <IncidentPanel onAction={onAction} inProgress={inProgress} authorizedEmergency={authorizedEmergency} onAuthorize={onAuthorize} />
            </div>
        </div>
    );
};

export default ActionPanel;
