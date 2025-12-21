export type Severity = 'low' | 'medium' | 'high';

export interface Alert {
    id: number;
    severity: Severity;
    message: string;
    recommendedAction: string;
    acknowledged: boolean;
}

export interface SystemState {
    stability: number;
    trustLevel: number;
    score: number;
}

export interface MetricPoint {
    time: number;
    stability: number;
    trust: number;
}
