


// Tier 1 Limits (Gemini 1.5 Pro / Flash)
// Based on Google AI Studio Tier 1
// RPM: 1000 (Requests Per Minute)
// TPM: 4,000,000 (Tokens Per Minute - Input) / 1,000,000 (Output)
// RPD: 4,000,000 (Requests Per Day) - High enough to essentially assume infinite for this use case

interface RateLimitConfig {
    maxRequestsPerMinute: number;
}

const TIER_1_CONFIG: RateLimitConfig = {
    // 1000 RPM is the limit. We set 900 for safety margin.
    maxRequestsPerMinute: 900,
};

class RateLimiter {
    private requestTimestamps: number[] = [];

    async waitForSlot(): Promise<void> {
        const now = Date.now();
        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60000);

        if (this.requestTimestamps.length >= TIER_1_CONFIG.maxRequestsPerMinute) {
            const oldest = this.requestTimestamps[0];
            const waitTime = 60000 - (now - oldest) + 100; // Wait until oldest expires
            if (waitTime > 0) {
                console.warn(`[Gemini Rate Limit] RPM threshold reached. Waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.waitForSlot(); // Re-check
            }
        }

        this.requestTimestamps.push(Date.now());
    }
}

export const rateLimiter = new RateLimiter();
