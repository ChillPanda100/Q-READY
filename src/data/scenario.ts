export const scenarioEvents = [
    {
        time: 20000, // 20s
        severity: 'low',
        message: 'Minor cryptographic handshake anomaly detected',
        recommendedAction: 'Monitor and prepare key rotation',
        stabilityDelta: -2,
        trustDelta: -4,
    },
    {
        time: 35000, // 35s
        severity: 'low',
        message: 'Time-sync jitter observed on several DERs',
        recommendedAction: 'Check NTP peers and logs',
        stabilityDelta: -3,
        trustDelta: -2,
    },
    {
        time: 48000, // 48s
        severity: 'medium',
        message: 'Anomalous firmware signature reported',
        recommendedAction: 'Isolate affected devices and rotate keys',
        stabilityDelta: -6,
        trustDelta: -12,
    },
    {
        time: 60000, // 60s
        severity: 'medium',
        message: 'Authentication inconsistencies across DER nodes',
        recommendedAction: 'Rotate cryptographic keys',
        stabilityDelta: -8,
        trustDelta: -15,
    },
    {
        time: 78000, // 78s
        severity: 'low',
        message: 'Unexpected certificate expiry warnings',
        recommendedAction: 'Verify certificate chain and renew',
        stabilityDelta: -4,
        trustDelta: -6,
    },
    {
        time: 92000, // 92s
        severity: 'medium',
        message: 'Suspicious configuration change detected in control plane',
        recommendedAction: 'Revert to known-good config and investigate',
        stabilityDelta: -10,
        trustDelta: -10,
    },
    {
        time: 100000, // 100s
        severity: 'high',
        message: 'Cryptographic trust failure impacting DER coordination',
        recommendedAction: 'Limit DER autonomy and escalate',
        stabilityDelta: -18,
        trustDelta: -28,
    },
    {
        time: 118000, // 118s
        severity: 'low',
        message: 'High latency on control messages (possible congestion)',
        recommendedAction: 'Investigate network links and retry policies',
        stabilityDelta: -5,
        trustDelta: -3,
    },
    {
        time: 132000, // 132s
        severity: 'medium',
        message: 'Third-party CA reported suspicious signing activity',
        recommendedAction: 'Quarantine dependent devices and rotate trust anchors',
        stabilityDelta: -12,
        trustDelta: -20,
    },
    {
        time: 148000, // 148s
        severity: 'high',
        message: 'Widespread certificate revocation lists update causing auth failures',
        recommendedAction: 'Limit services, roll back updates, escalate incident',
        stabilityDelta: -20,
        trustDelta: -30,
    },
    {
        time: 165000, // 165s
        severity: 'low',
        message: 'Operator-reported unexpected DER behavior (requires review)',
        recommendedAction: 'Schedule immediate patching and monitor',
        stabilityDelta: -4,
        trustDelta: -5,
    },
] as const;
