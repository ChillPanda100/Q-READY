import React, {useEffect} from 'react';

interface Props {
    onStart: () => void;
}

const TitlePage: React.FC<Props> = ({ onStart }) => {
    useEffect(() => {
        // diagnostic log to help verify the component is mounting
        // remove this after debugging
        console.log('[TitlePage] mounted');
    }, []);

    return (
        <div className="panel title-page" style={{textAlign: 'center', outline: 'none', border: '1px dashed rgba(255,255,255,0.06)'}}>
            <h2 style={{marginBottom: 12}}>Welcome to the Q-Ready Grid Incident Simulation</h2>

            <p style={{color: 'var(--text-secondary)', marginBottom: 18}}>
                This interactive simulation demonstrates how a power grid responds to
                post-quantum cryptographic incidents. You'll see live system metrics,
                alerts, and actionable controls — test your decisions and watch the
                system evolve in real time.
            </p>

            <p style={{color: 'var(--text-secondary)', marginBottom: 22}}>
                The simulation assumes the grid has already been running for some time;
                metrics will appear immediately and update continuously. When you're
                ready, press Start to enter the simulation.
            </p>

            <div>
                <button onClick={onStart} style={{fontSize: '1rem', padding: '10px 18px'}}>Start Simulation</button>
            </div>
        </div>
    );
};

export default TitlePage;
