import React from 'react';

const ScorePanel: React.FC<{ score: number }> = ({ score }) => (
    <div className="score">
        <h2>Simulation Complete</h2>
        <p>Final Score: {score}</p>
    </div>
);

export default ScorePanel;
