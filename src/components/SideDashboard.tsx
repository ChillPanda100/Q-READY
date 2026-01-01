import React from 'react';
import AlertHistoryDrawer from './AlertHistoryDrawer';
import type { Alert } from '../types';

interface SideDashboardProps {
    open: boolean;
    onClose: () => void;
    alerts?: Alert[];
    onResolve?: (id: number, summary: string, confidence: string) => void;
    onEscalate?: (id: number, note?: string) => void;
}

const SideDashboard: React.FC<SideDashboardProps> = ({ open, onClose, alerts = [], onResolve = () => {}, onEscalate = () => {} }) => {
    return (
        <div className={`side-dashboard ${open ? 'open' : ''}`} aria-hidden={!open}>
            <div className="side-dashboard-header">
                <h3>Dashboard</h3>
                <button className="close-drawer" onClick={onClose}>×</button>
            </div>
            <div className="side-dashboard-body">
                {/* embed the alert history drawer inside this dashboard so controls fit */}
                <AlertHistoryDrawer open={open} onClose={onClose} alerts={alerts} onResolve={onResolve} onEscalate={onEscalate} embedded />
            </div>
        </div>
    );
};

export default SideDashboard;
