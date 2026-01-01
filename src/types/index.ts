export type Severity = 'low' | 'medium' | 'high';

export type AlertStatus = 'active' | 'resolved' | 'escalated' | 'unresolved';

export interface Alert {
    id: number;
    severity: Severity;
    message: string;
    recommendedAction: string;
    acknowledged: boolean;

    // New fields for history and lifecycle
    createdAt: number; // absolute timestamp
    status: AlertStatus;
    affectedMetrics: string[]; // e.g., ['Crypto', 'Network']
    aiDescription?: string;
    actionsTaken?: string[]; // operator actions associated with this alert

    // resolution fields (populated when resolved/escalated)
    resolutionTimestamp?: number | null;
    resolutionSummary?: string | null;
    confidence?: string | null; // e.g., 'Fully mitigated', 'Partially mitigated'

    // store metric snapshots for timeline / before-after analysis
    metricSnapshots?: Array<{
        time: number;
        stability: number;
        trust: number;
        firmwareIntegrity: number;
        certHealth: number;
        networkHealth: number;
    }>;
}

export interface SystemState {
    stability: number;
    trustLevel: number;
    firmwareIntegrity: number; // 0-100
    certHealth: number; // 0-100
    networkHealth: number; // 0-100 (higher = better)
    score: number;
}

export interface MetricPoint {
    time: number;
    stability: number;
    trust: number;
    firmwareIntegrity: number;
    certHealth: number;
    networkHealth: number;
}

export interface ActionRecord {
    id: number;
    action: string; // canonical action key e.g., 'rotate'
    label: string; // human-friendly label
    time: number; // timestamp
    triggeredBy: 'Operator' | 'AI' | 'System';
    affectedMetrics: string[]; // human-readable metric change strings
    results: string[]; // result summary lines (check/x markers)
}
