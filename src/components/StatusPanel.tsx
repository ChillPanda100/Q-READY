import React from 'react';
import type {SystemState} from '../types';

const StatusPanel: React.FC<{ system: SystemState }> = ({ system }) => (
    <div className="panel">
        <h2>System Status</h2>
<p>Grid Stability: {system.stability}%</p>
<p>Cryptographic Trust: {system.trustLevel}%</p>
</div>
);

export default StatusPanel;
