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
            <div style={{display: 'flex', flexDirection: 'row', gap: 12, overflow: 'visible', paddingBottom: 6, alignItems: 'flex-start'}}>
                <div style={{flex: '1 1 0', minWidth: 0}}><DERPanel onAction={onAction} inProgress={inProgress} system={system} /></div>
                <div style={{flex: '1 1 0', minWidth: 0}}><PKIPanel onAction={onAction} inProgress={inProgress} system={system} authorizedEmergency={authorizedEmergency} pqOnCooldown={pqOnCooldown} /></div>
                <div style={{flex: '1 1 0', minWidth: 0}}><FirmwarePanel onAction={onAction} inProgress={inProgress} system={system} authorizedEmergency={authorizedEmergency} /></div>
                <div style={{flex: '1 1 0', minWidth: 0}}><NetworkPanel onAction={onAction} inProgress={inProgress} system={system} /></div>
                <div style={{flex: '1 1 0', minWidth: 0}}><IncidentPanel onAction={onAction} inProgress={inProgress} authorizedEmergency={authorizedEmergency} onAuthorize={onAuthorize} /></div>
            </div>
        </div>
    );
};

export default ActionPanel;
