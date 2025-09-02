// lib/apiRateLimit.ts
// Simple in-memory rate limiting to prevent excessive API calls

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/**
 * Check if an API call is allowed based on rate limiting
 * @param key - Unique key for the API (e.g., 'pexels', 'unsplash', 'weather')
 * @param maxCalls - Maximum calls allowed per window
 * @param windowMs - Time window in milliseconds
 * @returns true if call is allowed, false if rate limited
 */
export function isAPICallAllowed(key: string, maxCalls: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  if (!entry || now > entry.resetTime) {
    // First call or window has reset
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (entry.count >= maxCalls) {
    console.warn(`Rate limit exceeded for ${key}. Max ${maxCalls} calls per ${windowMs}ms.`)
    return false
  }
  
  entry.count++
  return true
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(key: string): { count: number; remaining: number; resetTime: number } | null {
  const entry = rateLimitMap.get(key)
  if (!entry) return null
  
  const maxCalls = 100 // Default, should match what was used in isAPICallAllowed
  return {
    count: entry.count,
    remaining: Math.max(0, maxCalls - entry.count),
    resetTime: entry.resetTime
  }
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key)
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear()
}