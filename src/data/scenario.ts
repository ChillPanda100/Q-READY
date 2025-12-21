export const scenarioEvents = [
    {
        time: 20000, // 20s
        severity: 'low',
        message: 'Minor cryptographic handshake anomaly detected',
        recommendedAction: 'Monitor and prepare key rotation',
    },
    {
        time: 60000, // 60s
        severity: 'medium',
        message: 'Authentication inconsistencies across DER nodes',
        recommendedAction: 'Rotate cryptographic keys',
    },
    {
        time: 100000, // 100s
        severity: 'high',
        message: 'Cryptographic trust failure impacting DER coordination',
        recommendedAction: 'Limit DER autonomy and escalate',
    },
] as const;
