// In ai-service.ts
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Vor AI-Call:
const cached = await getCachedContent(municipality, type);
if (cached && !isExpired(cached)) return cached;

// Nach AI-Call:
await cacheContent(municipality, type, result);