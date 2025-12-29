import React from 'react';
import type {SystemState} from '../types';

const bar = (value: number, color: string) => ({
    width: `${Math.max(0, Math.min(100, value))}%`,
    height: '8px',
    background: color,
    borderRadius: '6px'
});

const StatusPanel: React.FC<{ system: SystemState }> = ({ system }) => (
    <div className="panel status-panel">
        <h2>System Status</h2>
        <div className="status-body">
            <p>Grid Stability: {system.stability}%</p>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', width: '100%', height: 10}}>
                <div style={bar(system.stability, '#3b82f6')} />
            </div>
            <p style={{marginTop:8}}>Cryptographic Trust: {system.trustLevel}%</p>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', width: '100%', height: 10}}>
                <div style={bar(system.trustLevel, '#22c55e')} />
            </div>

            <p style={{marginTop:8}}>Firmware Integrity: {system.firmwareIntegrity}%</p>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', width: '100%', height: 10}}>
                <div style={bar(system.firmwareIntegrity, '#f59e0b')} />
            </div>

            <p style={{marginTop:8}}>Certificate Health: {system.certHealth}%</p>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', width: '100%', height: 10}}>
                <div style={bar(system.certHealth, '#ef4444')} />
            </div>

            <p style={{marginTop:8}}>Network Health: {system.networkHealth}%</p>
            <div style={{background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', width: '100%', height: 10}}>
                <div style={bar(system.networkHealth, '#60a5fa')} />
            </div>
        </div>
    </div>
);

export default StatusPanel;
