export interface ScenarioEvent {
    time: number;
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendedAction: string;
    stabilityDelta?: number;
    trustDelta?: number;
}

export const scenarioEvents: ScenarioEvent[] = [
    {
        time: 11200, // 11.2s (was 16s)
        severity: 'low',
        message: 'Minor cryptographic handshake anomaly detected',
        recommendedAction: 'Monitor and prepare key rotation',
        stabilityDelta: -2,
        trustDelta: -4,
    },
    {
        time: 28000, // 28s (was 40s)
        severity: 'low',
        message: 'Time-sync jitter observed on several DERs',
        recommendedAction: 'Check NTP peers and logs',
        stabilityDelta: -3,
        trustDelta: -2,
    },
    {
        time: 42560, // 42.56s (was 60.8s)
        severity: 'medium',
        message: 'Anomalous firmware signature reported',
        recommendedAction: 'Isolate affected devices and rotate keys',
        stabilityDelta: -6,
        trustDelta: -12,
    },
    {
        time: 56000, // 56s (was 80s)
        severity: 'medium',
        message: 'Authentication inconsistencies across DER nodes',
        recommendedAction: 'Rotate cryptographic keys',
        stabilityDelta: -8,
        trustDelta: -15,
    },
    {
        time: 76160, // 76.16s (was 108.8s)
        severity: 'low',
        message: 'Unexpected certificate expiry warnings',
        recommendedAction: 'Verify certificate chain and renew',
        stabilityDelta: -4,
        trustDelta: -6,
    },
    {
        time: 91840, // 91.84s (was 131.2s)
        severity: 'medium',
        message: 'Suspicious configuration change detected in control plane',
        recommendedAction: 'Revert to known-good config and investigate',
        stabilityDelta: -10,
        trustDelta: -10,
    },
    {
        time: 100800, // 100.8s (was 144s)
        severity: 'high',
        message: 'Cryptographic trust failure impacting DER coordination',
        recommendedAction: 'Limit DER autonomy and escalate',
        stabilityDelta: -18,
        trustDelta: -28,
    },
    {
        time: 120960, // 120.96s (was 172.8s)
        severity: 'low',
        message: 'High latency on control messages (possible congestion)',
        recommendedAction: 'Investigate network links and retry policies',
        stabilityDelta: -5,
        trustDelta: -3,
    },
    {
        time: 136640, // 136.64s (was 195.2s)
        severity: 'medium',
        message: 'Third-party CA reported suspicious signing activity',
        recommendedAction: 'Quarantine dependent devices and rotate trust anchors',
        stabilityDelta: -12,
        trustDelta: -20,
    },
    {
        time: 154560, // 154.56s (was 220.8s)
        severity: 'high',
        message: 'Widespread certificate revocation lists update causing auth failures',
        recommendedAction: 'Limit services, roll back updates, escalate incident',
        stabilityDelta: -20,
        trustDelta: -30,
    },
];
