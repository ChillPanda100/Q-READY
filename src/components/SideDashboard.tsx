import React, { useState, useRef } from 'react';
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

    const alertsRef = useRef<HTMLButtonElement | null>(null);
    const actionsRef = useRef<HTMLButtonElement | null>(null);

    const onTabKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                setTab('actions');
                actionsRef.current?.focus();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setTab('alerts');
                alertsRef.current?.focus();
                break;
            case 'Home':
                e.preventDefault();
                setTab('alerts');
                alertsRef.current?.focus();
                break;
            case 'End':
                e.preventDefault();
                setTab('actions');
                actionsRef.current?.focus();
                break;
            default:
                break;
        }
    };

    return (
        <div className={`side-dashboard ${open ? 'open' : ''}`} aria-hidden={!open}>
            <div className="side-dashboard-header">
                {/* Tabs replacing previous title and button row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div role="tablist" aria-label="Dashboard Tabs" style={{ display: 'flex', gap: 8 }} onKeyDown={onTabKeyDown}>
                        <button
                            id="tab-alerts"
                            ref={alertsRef}
                            role="tab"
                            aria-selected={tab === 'alerts'}
                            aria-controls="panel-alerts"
                            tabIndex={tab === 'alerts' ? 0 : -1}
                            className={`tab-btn ${tab === 'alerts' ? 'active' : ''}`}
                            onClick={() => setTab('alerts')}
                        >
                            Alerts
                        </button>
                        <button
                            id="tab-actions"
                            ref={actionsRef}
                            role="tab"
                            aria-selected={tab === 'actions'}
                            aria-controls="panel-actions"
                            tabIndex={tab === 'actions' ? 0 : -1}
                            className={`tab-btn ${tab === 'actions' ? 'active' : ''}`}
                            onClick={() => setTab('actions')}
                        >
                            Actions
                        </button>
                    </div>
                    <button className="close-drawer" onClick={onClose} aria-label="Close drawer">×</button>
                </div>
            </div>
            <div className="side-dashboard-body">
                {/* Use ARIA tabpanel wrappers so assistive tech can associate tabs with panels */}
                <div
                    role="tabpanel"
                    id="panel-alerts"
                    aria-labelledby="tab-alerts"
                    hidden={tab !== 'alerts'}
                >
                    <AlertHistoryDrawer open={open} onClose={onClose} alerts={alerts} onResolve={onResolve} onEscalate={onEscalate} embedded />
                </div>
                <div
                    role="tabpanel"
                    id="panel-actions"
                    aria-labelledby="tab-actions"
                    hidden={tab !== 'actions'}
                >
                    <ActionHistoryPanel actions={actions} />
                </div>
            </div>
        </div>
    );
};

export default SideDashboard;
