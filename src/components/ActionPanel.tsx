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
        </div>
    );
};

export default ActionPanel;
