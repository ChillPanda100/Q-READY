import React from 'react';

interface Props {
    onStart: () => void;
}

const TitlePage: React.FC<Props> = ({ onStart }) => {
    return (
        <div
            className="panel title-page"
            style={{
                textAlign: 'center',
                outline: 'none',
                border: '1px dashed rgba(255,255,255,0.06)',
                padding: 22,
            }}
            role="region"
            aria-label="Simulation introduction"
        >
            <h2 style={{ marginBottom: 12 }}>Welcome to Q-Ready</h2>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
                This interactive simulation trains operator decision making for
                DER-powered grids. The system models security, firmware, network
                and operational tradeoffs, including emerging risks from quantum computing
                that threaten widely-used public-key cryptography so you can practice responding to
                realistic incidents where cryptography, firmware integrity, and operational resilience interact.
            </p>

            <div style={{ textAlign: 'left', maxWidth: 720, margin: '10px auto 18px' }}>
                <h3 style={{ margin: '6px 0' }}>What you will see</h3>
                <ul style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    <li>Live metric charts for Grid Stability, Cryptographic Trust, Firmware Integrity, Certificate Health and Network Health</li>
                    <li>An active alerts panel with AI-generated recommendations and explanations</li>
                    <li>Domain action panels where you can trigger operator actions that take time and may have tradeoffs</li>
                    <li>An audit/history view that records actions, alerts and metric snapshots for after-action review</li>
                </ul>

                <h3 style={{ margin: '10px 0 6px' }}>How to play</h3>
                <ol style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    <li>Press Start to begin the scenario.</li>
                    <li>Watch the metric graph and alerts. AI will suggest actions and explain why.</li>
                    <li>Choose actions from the panels: note that some actions require authorization and have cooldowns.</li>
                    <li>Use the side dashboard to view alert/action history.</li>
                </ol>

                <h3 style={{ margin: '10px 0 6px' }}>Quick tips</h3>
                <ul style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
                    <li>Actions take simulated time to complete; expect temporary side effects.</li>
                    <li>AI suggestions are advisory. Read the rationale before acting.</li>
                    <li>Look for cascading alerts; resolving one may reveal another.</li>
                </ul>
            </div>

            <div style={{ marginTop: 8 }}>
                <button
                    onClick={onStart}
                    style={{ fontSize: '1rem', padding: '10px 18px' }}
                    aria-label="Start simulation"
                >
                    Start Simulation
                </button>
            </div>
        </div>
    );
};

export default TitlePage;
