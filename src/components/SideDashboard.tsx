import React, { useState } from 'react';
import AlertHistoryDrawer from './AlertHistoryDrawer';
import ActionHistoryPanel from './ActionHistoryPanel';
import type { Alert, ActionRecord } from '../types';

interface SideDashboardProps {
    open: boolean;
    onClose: () => void;
    alerts?: Alert[];
    actions?: ActionRecord[];
    activeTab?: 'alerts' | 'actions';
    onResolve?: (id: number, summary: string, confidence: string) => void;
    onEscalate?: (id: number, note?: string) => void;
    onPerformAction?: (action: string) => void;
}

const SideDashboard: React.FC<SideDashboardProps> = ({ open, onClose, alerts = [], actions = [], activeTab, onResolve = () => {}, onEscalate = () => {} }) => {
    const [tab, setTab] = useState<'alerts' | 'actions'>(activeTab ?? 'alerts');

    // keep tab in sync when parent controls activeTab
    React.useEffect(() => {
        if (activeTab) setTab(activeTab);
    }, [activeTab]);

    return (
        <div className={`side-dashboard ${open ? 'open' : ''}`} aria-hidden={!open}>
            <div className="side-dashboard-header">
                <h3>Dashboard</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`tab-btn ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>Alerts</button>
                    <button className={`tab-btn ${tab === 'actions' ? 'active' : ''}`} onClick={() => setTab('actions')}>Actions</button>
                    <button className="close-drawer" onClick={onClose}>×</button>
                </div>
            </div>
            <div className="side-dashboard-body">
                {tab === 'alerts' ? (
                    <AlertHistoryDrawer open={open} onClose={onClose} alerts={alerts} onResolve={onResolve} onEscalate={onEscalate} embedded />
                ) : (
                    <ActionHistoryPanel actions={actions} />
                )}
            </div>
        </div>
    );
};

export default SideDashboard;
