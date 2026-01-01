import React from 'react';

interface SideDashboardProps {
    open: boolean;
    onClose: () => void;
}

const SideDashboard: React.FC<SideDashboardProps> = ({ open, onClose }) => {
    return (
        <aside className={`side-dashboard ${open ? 'open' : ''}`} aria-hidden={!open}>
            <div className="side-dashboard-header">
                <h3>Side Dashboard</h3>
                <button className="close-drawer" onClick={onClose} aria-label="Close dashboard">×</button>
            </div>

            <div className="side-dashboard-body">
                <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Quick links and controls</p>
                <ul style={{ paddingLeft: 18, marginTop: 10 }}>
                    <li>Overview</li>
                    <li>Metrics</li>
                    <li>Incident Log</li>
                    <li>Settings</li>
                </ul>
            </div>
        </aside>
    );
};

export default SideDashboard;

