// API Client — The Bottle Club
// Base fetch client for https://api.wayneven.uk/api/v1/

import type { ApiError } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.wayneven.uk/api/v1'
const HEALTH_URL = BASE_URL.endsWith('/api/v1')
  ? BASE_URL.replace('/api/v1', '/health')
  : 'https://api.wayneven.uk/health'

export class ApiClientError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail)
    this.name = 'ApiClientError'
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string
  branchId?: number | null
  isFormData?: boolean
  signal?: AbortSignal
  skipCache?: boolean
  cacheTtlMs?: number
  _retry?: boolean
}

type CacheEntry = {
  data: any
  expiresAt: number
}

const DEFAULT_CACHE_TTL_MS = 25_000 // 25 seconds fast navigation cache
const memoryCache = new Map<string, CacheEntry>()
const inFlightGetRequests = new Map<string, Promise<any>>()

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear()
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(prefix)) {
        memoryCache.delete(key)
      }
    }
  }
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    isFormData = false,
    signal,
    skipCache = false,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    _retry = false
  } = opts
  let { token, branchId } = opts

  const isGet = method.toUpperCase() === 'GET'

  if (!path.startsWith('/auth/login')) {
    try {
      const { useApiAuth, ensureApiAuth, isTokenExpired } = await import('@/lib/store/api-auth')
      if (!token || isTokenExpired(token)) {
        token = (await ensureApiAuth()) ?? undefined
      }
      if (branchId == null) {
        branchId = (typeof window !== 'undefined' ? useApiAuth.getState().currentBranchId : null) ?? 1
      }
    } catch {
      // Fallback
    }
  }

  if (branchId == null) {
    branchId = 1
  }

  const ROOT_URL = BASE_URL.replace(/\/api\/v1\/?$/, '')
  const fullUrl = path.startsWith('http')
    ? path
    : (path.startsWith('/api/') || path.startsWith('/health'))
    ? `${ROOT_URL}${path}`
    : `${BASE_URL}${path}`

  const cacheKey = `${fullUrl}:${branchId ?? 1}:${token ? 'auth' : 'anon'}`

  // 1. Serve from in-memory cache for idempotent GET requests
  if (isGet && !skipCache) {
    const cached = memoryCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T
    }
    // Return existing in-flight request if another component is fetching the exact same URL
    if (inFlightGetRequests.has(cacheKey)) {
      return inFlightGetRequests.get(cacheKey) as Promise<T>
    }
  }

  // 2. Mutations invalidate related cached GET data
  if (!isGet) {
    const resource = path.split('/')[1] || ''
    if (resource) {
      clearApiCache(resource)
    } else {
      clearApiCache()
    }
  }

  const performFetch = async (): Promise<T> => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Branch-Id': String(branchId || 1),
    }

    if (token) headers['Authorization'] = `Bearer ${token}`
    if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json'

    // Add safe timeout: 10s for GET, 15s for mutations
    const timeoutMs = isGet ? 10_000 : 15_000
    const timeoutController = new AbortController()
    const timerId = setTimeout(() => {
      timeoutController.abort(new Error(`API request timed out after ${timeoutMs}ms: ${path}`))
    }, timeoutMs)

    if (signal) {
      if (signal.aborted) {
        timeoutController.abort(signal.reason)
      } else {
        signal.addEventListener('abort', () => timeoutController.abort(signal.reason), { once: true })
      }
    }

    let res: Response
    try {
      res = await fetch(fullUrl, {
        method,
        headers,
        body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
        signal: timeoutController.signal,
      })
    } finally {
      clearTimeout(timerId)
    }

    // Auto-retry on 401 Unauthorized by re-authenticating with superadmin credentials
    if (res.status === 401 && !_retry && !path.startsWith('/auth/login')) {
      try {
        const { ensureApiAuth } = await import('@/lib/store/api-auth')
        const freshToken = await ensureApiAuth(true)
        if (freshToken) {
          return apiRequest<T>(path, { ...opts, token: freshToken, branchId: branchId || 1, _retry: true, skipCache: true })
        }
      } catch {
        // Fall through to error
      }
    }

    if (res.status === 204) return undefined as unknown as T

    const contentType = res.headers.get('content-type') || ''
    let data: any

    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({ detail: res.statusText }))
    } else {
      const text = await res.text().catch(() => res.statusText)
      data = { detail: text || res.statusText }
    }

    if (!res.ok) {
      const err = data as ApiError
      const msg =
        typeof err.detail === 'string'
          ? err.detail
          : Array.isArray(err.detail)
          ? err.detail.map((e) => e.msg).join(', ')
          : err.message ?? `HTTP ${res.status}: ${res.statusText}`
      throw new ApiClientError(res.status, msg)
    }

    // Unwrap { data: ... } envelope if present from FastAPI backend
    let result: T
    if (data && typeof data === 'object' && 'data' in data && data.data !== undefined) {
      result = data.data as T
    } else {
      result = data as T
    }

    // Store in cache for future GETs
    if (isGet && !skipCache) {
      if (memoryCache.size > 100) {
        const oldestKey = memoryCache.keys().next().value
        if (oldestKey) memoryCache.delete(oldestKey)
      }
      memoryCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + cacheTtlMs,
      })
    }

    return result
  }

  if (isGet && !skipCache) {
    const fetchPromise = performFetch().finally(() => {
      inFlightGetRequests.delete(cacheKey)
    })
    inFlightGetRequests.set(cacheKey, fetchPromise)
    return fetchPromise
  }

  return performFetch()
}

export async function checkHealth(): Promise<Record<string, string>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(HEALTH_URL, { cache: 'no-store', signal: controller.signal })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`Health check failed with HTTP ${res.status}`)
    }
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}
