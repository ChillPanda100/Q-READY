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
