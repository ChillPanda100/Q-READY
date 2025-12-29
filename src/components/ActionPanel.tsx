import React from 'react';

interface Props {
    onAction: (action: string) => void;
}

const ActionPanel: React.FC<Props> = ({ onAction }) => {
    return (
        <div className="panel">
            <h2>Operator Actions</h2>
            <button onClick={() => onAction('rotate')}>Rotate Keys</button>
            <button onClick={() => onAction('limit')}>Limit DER Autonomy</button>
            <button onClick={() => onAction('escalate')}>Escalate Incident</button>
            <div style={{marginTop: 10}}>
                <button onClick={() => onAction('patch')}>Apply Firmware Patch</button>
                <button onClick={() => onAction('renew')}>Renew Certificates</button>
                <button onClick={() => onAction('mitigate-network')}>Mitigate Network</button>
                <button onClick={() => onAction('reboot')}>Reboot Affected DERs</button>
            </div>
        </div>
    );
};

export default ActionPanel;
