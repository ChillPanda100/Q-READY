import React, {useMemo, useRef, useState, useEffect} from 'react';
import type {MetricPoint} from '../types';

interface Props {
    data: MetricPoint[];
}

const WIDTH = 900;
const HEIGHT = 320;
const PADDING = 60;

function readableDuration(ms: number) {
    if (ms < 1000) return `${ms} ms`;
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h`;
}

const MetricGraph: React.FC<Props> = ({data}) => {
    // zoom window in ms (default 120s)
    const [windowMs, setWindowMs] = useState<number>(120000);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Make a copy and sort by time to ensure correct path order
    const sorted = useMemo(() => (data ? [...data].sort((a, b) => a.time - b.time) : []), [data]);

    // Determine the end time (latest sample or now)
    const maxTime = sorted.length > 0 ? Math.max(...sorted.map(d => d.time)) : Date.now();
    const endTime = Math.max(maxTime, Date.now());
    const minTime = endTime - windowMs;

    // X ticks based on endTime/minTime
    const xTicks: number[] = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) xTicks.push(minTime + (i / tickCount) * (endTime - minTime));

    // Interpolation helper: get interpolated value at time t for any metric key
    type MetricKey = Exclude<keyof MetricPoint, 'time'>;
    const getValueAt = (t: number, key: MetricKey) => {
        if (sorted.length === 0) return 100;
        if (t <= sorted[0].time) return (sorted[0][key] ?? 100) as number;
        if (t >= sorted[sorted.length - 1].time) return (sorted[sorted.length - 1][key] ?? 100) as number;
        let lo = 0, hi = sorted.length - 1;
        while (lo + 1 < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (sorted[mid].time <= t) lo = mid; else hi = mid;
        }
        const a = sorted[lo];
        const b = sorted[hi];
        const span = b.time - a.time || 1;
        const frac = (t - a.time) / span;
        const aval = (a[key] ?? 100) as number;
        const bval = (b[key] ?? 100) as number;
        return aval + (bval - aval) * frac;
    };

    // Metrics metadata and visibility state
    const metricsMeta: { key: MetricKey; label: string; color: string }[] = [
        { key: 'stability', label: 'Grid Stability', color: '#3b82f6' },
        { key: 'trust', label: 'Cryptographic Trust', color: '#22c55e' },
        { key: 'firmwareIntegrity', label: 'Firmware Integrity', color: '#f59e0b' },
        { key: 'certHealth', label: 'Certificate Health', color: '#ef4444' },
        // using a light purple for network health to distinguish it from other blues
        { key: 'networkHealth', label: 'Network Health', color: '#a78bfa' },
    ];

    const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>(() => {
        const initial = {} as Record<MetricKey, boolean>;
        metricsMeta.forEach(m => initial[m.key] = true);
        return initial;
    });

    const toggleMetric = (k: MetricKey) => setVisibleMetrics(prev => ({ ...prev, [k]: !prev[k] }));

    // Resample across the visible window for smooth zooming: choose resolution
    // proportional to the window: smaller windows get more samples.
    const usedVisible = useMemo(() => {
        const seconds = Math.max(1, Math.round(windowMs / 1000));
        const N = Math.min(600, Math.max(80, Math.round(seconds * 2))); // ~2 samples per second, clamped
        const arr: MetricPoint[] = [];
        for (let i = 0; i < N; i++) {
            const t = Math.round(minTime + (i / (N - 1)) * (endTime - minTime));
            const stability = getValueAt(t, 'stability');
            const trust = getValueAt(t, 'trust');
            const firmwareIntegrity = getValueAt(t, 'firmwareIntegrity');
            const certHealth = getValueAt(t, 'certHealth');
            const networkHealth = getValueAt(t, 'networkHealth');
            arr.push({ time: t, stability, trust, firmwareIntegrity, certHealth, networkHealth });
        }
        return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sorted, windowMs, endTime]);

    const scaleX = (t: number) => PADDING + ((t - minTime) / (windowMs || 1)) * (WIDTH - PADDING * 2);
    const scaleY = (v: number) => HEIGHT - PADDING - (v / 100) * (HEIGHT - PADDING * 2);

    // Linear path generator (no curves)
    const linePath = (key: MetricKey) =>
        usedVisible.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.time)} ${scaleY(d[key])}`).join(' ');

    // Wheel zoom handler (over svg)
    useEffect(() => {
        const el = svgRef.current;
        if (!el) return;
        const onWheel = (ev: WheelEvent) => {
            // Zoom only when Ctrl key OR when over graph (allow simple wheel)
            ev.preventDefault();
            const delta = Math.sign(ev.deltaY) || 1;
            const factor = Math.exp(delta * 0.08); // smooth exponential zoom
            setWindowMs(prev => {
                const next = Math.round(prev * factor);
                return Math.min(Math.max(next, 5000), 24 * 3600 * 1000); // clamp 5s .. 24h
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const zoomIn = () => setWindowMs(prev => Math.max(5000, Math.round(prev / 1.5)));
    const zoomOut = () => setWindowMs(prev => Math.min(24 * 3600 * 1000, Math.round(prev * 1.5)));

    // For accessibility: keyboard +/- to control when svg focused
    useEffect(() => {
        const el = svgRef.current;
        if (!el) return;
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === '+') zoomIn();
            if (ev.key === '-') zoomOut();
        };
        el.addEventListener('keydown', onKey);
        return () => el.removeEventListener('keydown', onKey);
    }, []);

    // animation/tick settings (kept from original)
    const tickLen = 6;
    const gridLen = WIDTH - PADDING * 2;
    const tickAnimDuration = 30;
    const tickDelayStep = 4;
    const labelDelayOffset = 6;
    const baseXTickDelay = 8;

    return (
        <div className="panel metric-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative'}}>
                <h2 style={{margin: 0}}>Live System Metrics</h2>
                <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4}}>
                        <div style={{fontSize: 12, color: 'var(--text-secondary)'}}>Window: {readableDuration(windowMs)}</div>
                        <div style={{fontSize: 11, color: 'var(--text-secondary)', opacity: 0.9}}>Zoom: mouse wheel • + / - keys</div>
                    </div>
                    <div style={{display: 'flex', gap: 6}}>
                        <button onClick={zoomIn} title="Zoom in" style={{padding: '6px 8px'}}>＋</button>
                        <button onClick={zoomOut} title="Zoom out" style={{padding: '6px 8px'}}>－</button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes drawLine { to { stroke-dashoffset: 0; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
            `}</style>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                width="100%"
                height={HEIGHT}
                preserveAspectRatio="xMidYMid meet"
                tabIndex={0}
                style={{touchAction: 'none', display: 'block'}}
            >
                {/* Y Axis */}
                <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#475569"/>

                {/* X Axis */}
                <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#475569"/>

                {/* Y-axis labels & grid */}
                { [0,20,40,60,80,100].map((v, i) => {
                    const delay = i * tickDelayStep;
                    return (
                        <g key={v}>
                            <text x={PADDING - 12} y={scaleY(v) + 4} fontSize={11} fill="#9ca3af" textAnchor="end"
                                  style={{animation: `fadeIn 300ms ease forwards`, animationDelay: `${delay + labelDelayOffset}ms`, opacity: 0}}>
                                {v}%
                            </text>
                            <line x1={PADDING} y1={scaleY(v)} x2={WIDTH - PADDING} y2={scaleY(v)} stroke="#1f2933"
                                  strokeDasharray={`${gridLen}`} strokeDashoffset={`${gridLen}`}
                                  style={{animation: `drawLine ${tickAnimDuration}ms linear forwards`, animationDelay: `${delay}ms`}} />
                        </g>
                    );
                })}

                {/* X-axis ticks & labels */}
                {xTicks.map((t, i) => {
                    const delay = i * tickDelayStep + baseXTickDelay;
                    return (
                        <g key={i}>
                            <line x1={scaleX(t)} y1={HEIGHT - PADDING} x2={scaleX(t)} y2={HEIGHT - PADDING + tickLen} stroke="#475569"
                                  strokeDasharray={`${tickLen}`} strokeDashoffset={`${tickLen}`}
                                  style={{animation: `drawLine ${tickAnimDuration}ms linear forwards`, animationDelay: `${delay}ms`}} />
                            <text x={scaleX(t)} y={HEIGHT - PADDING + 18} fontSize={11} fill="#9ca3af" textAnchor="middle"
                                  style={{animation: `fadeIn 300ms ease forwards`, animationDelay: `${delay + labelDelayOffset}ms`, opacity: 0}}>
                                {(() => {
                                    const sec = Math.round((endTime - t) / 1000);
                                    if (sec < 60) return `${sec}s`;
                                    const m = Math.floor(sec / 60);
                                    const s = sec % 60;
                                    return `${m}m ${s}s`;
                                })()}
                            </text>
                        </g>
                    );
                })}

                {/* Render each metric line only if selected */}
                {visibleMetrics['stability'] && <path d={linePath('stability')} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {visibleMetrics['trust'] && <path d={linePath('trust')} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {visibleMetrics['firmwareIntegrity'] && <path d={linePath('firmwareIntegrity')} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {visibleMetrics['certHealth'] && <path d={linePath('certHealth')} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {visibleMetrics['networkHealth'] && <path d={linePath('networkHealth')} fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

                {/* Axis labels */}
                 <text x={(WIDTH + PADDING) / 2} y={HEIGHT - 12} fontSize={12} fill="#cbd5e1" textAnchor="middle">Time (s)</text>

            </svg>

            <div style={{display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem', flexWrap: 'wrap'}}>
                {metricsMeta.map(m => (
                    <label key={m.key} className="metric-toggle" style={{ ...( { ['--accent']: m.color } as React.CSSProperties), fontSize: 13}}>
                         <input type="checkbox" checked={visibleMetrics[m.key]} onChange={() => toggleMetric(m.key)} />
                         <span style={{color: visibleMetrics[m.key] ? m.color : 'rgba(156,163,175,0.6)'}}>{m.label}</span>
                     </label>
                 ))}
             </div>
         </div>
     );
 };

export default MetricGraph;
