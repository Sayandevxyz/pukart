export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter: number
}

export interface RateLimiterStore {
  check(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> | RateLimitResult
  reset(identifier: string): Promise<void> | void
}

function makeAllowedResult(limit: number, current: number, resetTime: number): RateLimitResult {
  return {
    success: true,
    remaining: Math.max(0, limit - current),
    resetTime,
    retryAfter: 0,
  }
}

export class MemoryRateLimiterStore implements RateLimiterStore {
  private map = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        const now = Date.now()
        for (const [key, record] of this.map.entries()) {
          if (now > record.resetTime) {
            this.map.delete(key)
          }
        }
      }, 60000)
      if (timer && typeof timer.unref === 'function') {
        timer.unref()
      }
    }
  }

  check(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const record = this.map.get(identifier)

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs
      this.map.set(identifier, { count: 1, resetTime })
      return makeAllowedResult(limit, 1, resetTime)
    }

    if (record.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
      return {
        success: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter,
      }
    }

    record.count += 1
    return makeAllowedResult(limit, record.count, record.resetTime)
  }

  reset(identifier: string): void {
    this.map.delete(identifier)
  }

  clear(): void {
    this.map.clear()
  }
}

export class UpstashRateLimiterStore implements RateLimiterStore {
  private url: string
  private token: string

  constructor(url?: string, token?: string) {
    this.url = (url ?? process.env.UPSTASH_REDIS_REST_URL ?? '').replace(/\/$/, '')
    this.token = token ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
  }

  async check(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    if (!this.url || !this.token) {
      return defaultMemoryStore.check(identifier, limit, windowMs)
    }

    const key = `pukart:ratelimit:${identifier}`
    const now = Date.now()

    try {
      const response = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['PTTL', key],
        ]),
      })

      if (!response.ok) {
        throw new Error(`Upstash request failed with status ${response.status}`)
      }

      const results = (await response.json()) as Array<{ result?: number; error?: string }>
      const count = Number(results[0]?.result ?? 1)
      let ttl = Number(results[1]?.result ?? -1)

      if (ttl < 0) {
        await fetch(`${this.url}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        ttl = windowMs
      }

      const resetTime = now + (ttl > 0 ? ttl : windowMs)
      const retryAfter = Math.max(1, Math.ceil(ttl / 1000))

      if (count > limit) {
        return {
          success: false,
          remaining: 0,
          resetTime,
          retryAfter,
        }
      }

      return makeAllowedResult(limit, count, resetTime)
    } catch {
      return defaultMemoryStore.check(identifier, limit, windowMs)
    }
  }

  async reset(identifier: string): Promise<void> {
    if (!this.url || !this.token) {
      defaultMemoryStore.reset(identifier)
      return
    }
    const key = `pukart:ratelimit:${identifier}`
    try {
      await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
    } catch {
      defaultMemoryStore.reset(identifier)
    }
  }
}

export class DatabaseRateLimiterStore implements RateLimiterStore {
  async check(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    if (!process.env.DATABASE_URL) {
      return defaultMemoryStore.check(identifier, limit, windowMs)
    }

    try {
      const { pool } = await import('@/lib/db')
      const now = Date.now()
      const resetTime = now + windowMs

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "_rate_limit_counters" (
          "key" text PRIMARY KEY,
          "count" integer NOT NULL DEFAULT 1,
          "reset_time" bigint NOT NULL
        )
      `)

      const selectRes = await pool.query<{ count: number; reset_time: string }>(
        'SELECT "count", "reset_time" FROM "_rate_limit_counters" WHERE "key" = $1',
        [identifier]
      )

      if (selectRes.rows.length === 0 || now > Number(selectRes.rows[0].reset_time)) {
        await pool.query(
          `INSERT INTO "_rate_limit_counters" ("key", "count", "reset_time")
           VALUES ($1, 1, $2)
           ON CONFLICT ("key") DO UPDATE
           SET "count" = 1, "reset_time" = $2`,
          [identifier, resetTime]
        )
        return {
          success: true,
          remaining: Math.max(0, limit - 1),
          resetTime,
          retryAfter: 0,
        }
      }

      const currentCount = selectRes.rows[0].count
      const currentResetTime = Number(selectRes.rows[0].reset_time)

      if (currentCount >= limit) {
        const retryAfter = Math.max(1, Math.ceil((currentResetTime - now) / 1000))
        return {
          success: false,
          remaining: 0,
          resetTime: currentResetTime,
          retryAfter,
        }
      }

      await pool.query(
        'UPDATE "_rate_limit_counters" SET "count" = "count" + 1 WHERE "key" = $1',
        [identifier]
      )

      return makeAllowedResult(limit, currentCount + 1, currentResetTime)
    } catch {
      return this.fallback(identifier, limit, windowMs)
    }
  }

  private fallback(id: string, lim: number, win: number): RateLimitResult {
    return defaultMemoryStore.check(id, lim, win)
  }

  async reset(identifier: string): Promise<void> {
    try {
      const { pool } = await import('@/lib/db')
      await pool.query('DELETE FROM "_rate_limit_counters" WHERE "key" = $1', [identifier])
    } catch {
      defaultMemoryStore.reset(identifier)
    }
  }
}

export const defaultMemoryStore = new MemoryRateLimiterStore()
let customStore: RateLimiterStore | null = null

export function getActiveStore(): RateLimiterStore {
  if (customStore) return customStore

  // Keep in-memory implementation for tests and local dev
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return defaultMemoryStore
  }

  // Use Upstash Redis when env vars exist
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiterStore()
  }

  // Otherwise use database counter if DATABASE_URL exists
  if (process.env.DATABASE_URL) {
    return new DatabaseRateLimiterStore()
  }

  return defaultMemoryStore
}

export function setActiveStore(store: RateLimiterStore | null): void {
  customStore = store
}

function createDualResult(res: RateLimitResult): RateLimitResult & Promise<RateLimitResult> {
  const p = Promise.resolve(res)
  return Object.assign(p, res)
}

export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60000
): RateLimitResult & Promise<RateLimitResult> {
  const store = getActiveStore()
  if (store instanceof MemoryRateLimiterStore) {
    const res = store.check(identifier, limit, windowMs) as RateLimitResult
    return createDualResult(res)
  }

  const p = Promise.resolve(store.check(identifier, limit, windowMs))
  const syncFallback: RateLimitResult = {
    success: true,
    remaining: Math.max(0, limit - 1),
    resetTime: Date.now() + windowMs,
    retryAfter: 0,
  }
  return Object.assign(p, syncFallback)
}

export function resetRateLimit(identifier: string): void {
  const store = getActiveStore()
  const maybePromise = store.reset(identifier)
  if (maybePromise instanceof Promise) {
    maybePromise.catch(() => {})
  }
}
