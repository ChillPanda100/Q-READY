import React from 'react';
import type {MetricPoint} from '../types';

interface Props {
    data: MetricPoint[];
}

const WIDTH = 900;
const HEIGHT = 320;
const PADDING = 60;

const MetricGraph: React.FC<Props> = ({data}) => {
    if (!data || data.length < 2) return null;

    // Make a copy and sort by time to ensure correct path order
    const sorted = [...data].sort((a, b) => a.time - b.time);

    // Use absolute timestamps (ms since epoch) for robust real-time plotting
    const times = sorted.map(d => d.time);
    const maxTime = Math.max(...times);
    const windowMs = 120000; // 120 seconds window
    const minTime = maxTime - windowMs;

    const visible = sorted.filter(d => d.time >= minTime);
    if (visible.length < 2) return null;

    const scaleX = (t: number) =>
        PADDING + ((t - minTime) / (windowMs || 1)) * (WIDTH - PADDING * 2);

    const scaleY = (v: number) =>
        HEIGHT - PADDING - (v / 100) * (HEIGHT - PADDING * 2);

    // Y ticks every 20%
    const yTicks = [0, 20, 40, 60, 80, 100];

    // Linear path generator (no curves) — draw straight segments between points
    const linePath = (key: 'stability' | 'trust') =>
        visible
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.time)} ${scaleY(d[key])}`)
            .join(' ');

    // X ticks: create 5 ticks evenly spaced across visible range
    const xTicks: number[] = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
        xTicks.push(minTime + (i / tickCount) * (maxTime - minTime));
    }

    // animation timing
    const tickLen = 6; // px for small tick lines
    const gridLen = WIDTH - PADDING * 2; // full width for grid lines
    // reduced durations/delays for faster, smoother tick drawing
    // make ticks snappier and smoother
    // aggressive speed for very smooth/quick tick drawing
    // make ticks extremely fast for a nearly continuous draw effect
    const tickAnimDuration = 30; // ms (reduced)
    const tickDelayStep = 4; // ms between successive ticks (reduced)
    const labelDelayOffset = 6; // ms extra before label fades in (reduced)
    const baseXTickDelay = 8; // ms base delay for X-axis ticks (reduced)

    return (
        <div className="panel">
            <h2>Live System Metrics</h2>

            {/* Inline styles for tick drawing animation */}
            <style>{`
                @keyframes drawLine { to { stroke-dashoffset: 0; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
            `}</style>

            <svg width={WIDTH} height={HEIGHT}>
                {/* Y Axis */}
                <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#475569"/>

                {/* X Axis */}
                <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#475569"/>

                {/* Y-axis labels & grid */}
                {yTicks.map((v, i) => {
                    const delay = i * tickDelayStep;
                    return (
                        <g key={v}>
                            <text
                                x={PADDING - 12}
                                y={scaleY(v) + 4}
                                fontSize="11"
                                fill="#9ca3af"
                                textAnchor="end"
                                style={{
                                    animation: `fadeIn 300ms ease forwards`,
                                    animationDelay: `${delay + labelDelayOffset}ms`,
                                    opacity: 0
                                }}
                            >
                                {v}%
                            </text>
                            <line
                                x1={PADDING}
                                y1={scaleY(v)}
                                x2={WIDTH - PADDING}
                                y2={scaleY(v)}
                                stroke="#1f2933"
                                strokeDasharray={`${gridLen}`}
                                strokeDashoffset={`${gridLen}`}
                                style={{
                                    animation: `drawLine ${tickAnimDuration}ms linear forwards`,
                                    animationDelay: `${delay}ms`
                                }}
                            />
                        </g>
                    );
                })}

                {/* X-axis ticks & labels */}
                {xTicks.map((t, i) => {
                    const delay = i * tickDelayStep + baseXTickDelay; // start slightly after Y ticks
                    return (
                        <g key={i}>
                            <line
                                x1={scaleX(t)}
                                y1={HEIGHT - PADDING}
                                x2={scaleX(t)}
                                y2={HEIGHT - PADDING + tickLen}
                                stroke="#475569"
                                strokeDasharray={`${tickLen}`}
                                strokeDashoffset={`${tickLen}`}
                                style={{
                                    animation: `drawLine ${tickAnimDuration}ms linear forwards`,
                                    animationDelay: `${delay}ms`
                                }}
                            />
                            <text
                                x={scaleX(t)}
                                y={HEIGHT - PADDING + 18}
                                fontSize="11"
                                fill="#9ca3af"
                                textAnchor="middle"
                                style={{
                                    animation: `fadeIn 300ms ease forwards`,
                                    animationDelay: `${delay + labelDelayOffset}ms`,
                                    opacity: 0
                                }}
                            >
                                {Math.round((maxTime - t) / 1000)}s ago
                            </text>
                        </g>
                    );
                })}

                {/* Stability Line (linear) */}
                <path d={linePath('stability')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round"/>

                {/* Trust Line (linear) */}
                <path d={linePath('trust')} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round"/>

                {/* Axis Labels */}
                <text x={PADDING - 35} y={PADDING - 20} fontSize="12" fill="#cbd5e1" textAnchor="middle"
                      transform={`rotate(-90 ${PADDING - 35} ${PADDING - 20})`}>
                    Percentage
                </text>
                <text x={(WIDTH + PADDING) / 2} y={HEIGHT - 12} fontSize="12" fill="#cbd5e1" textAnchor="middle">
                    Time (s)
                </text>

            </svg>

            <div style={{display: 'flex', gap: '20px', marginTop: '8px', fontSize: '0.85rem'}}>
                <span style={{color: '#3b82f6'}}>● Grid Stability</span>
                <span style={{color: '#22c55e'}}>● Cryptographic Trust</span>
            </div>
        </div>
    );
};

export default MetricGraph;
