// Zustand store for API authentication state
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfileResponse } from '@/lib/api/types'
import { authApi } from '@/lib/api/auth'

export const DEFAULT_API_CREDENTIALS = {
  email: 'superadmin@thebottleclub.com',
  username: 'superadmin',
  password: 'postthebottleclub',
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = typeof window !== 'undefined'
      ? decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      : Buffer.from(base64, 'base64').toString('utf8')
    const payload = JSON.parse(jsonPayload)
    const now = Math.floor(Date.now() / 1000)
    return !payload.exp || now >= (payload.exp - 30)
  } catch {
    return true
  }
}

interface ApiAuthState {
  accessToken: string | null
  refreshToken: string | null
  profile: UserProfileResponse | null
  currentBranchId: number | null
  isAutoLoggingIn: boolean
  setTokens: (access: string, refresh: string) => void
  setProfile: (profile: UserProfileResponse) => void
  setBranchId: (id: number | null) => void
  clear: () => void
}

export const useApiAuth = create<ApiAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      profile: null,
      currentBranchId: null,
      isAutoLoggingIn: false,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setProfile: (profile) => set({ profile }),
      setBranchId: (id) => set({ currentBranchId: id }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, profile: null, currentBranchId: null }),
    }),
    { name: 'bottleclub-api-auth' }
  )
)

let inFlightAuthPromise: Promise<string | null> | null = null

/**
 * Ensures the API access token is available and fresh, automatically logging in
 * with superadmin credentials if no valid non-expired token is present.
 * Uses a singleton promise lock to prevent duplicate parallel login requests.
 */
export async function ensureApiAuth(forceRefresh = false): Promise<string | null> {
  const state = useApiAuth.getState()

  // 1. Fast path: token in memory is still valid
  if (!forceRefresh && state.accessToken && !isTokenExpired(state.accessToken)) {
    return state.accessToken
  }

  // 2. Direct localStorage check before Zustand persist finishes hydration
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('bottleclub-api-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const storedToken = parsed?.state?.accessToken
        if (storedToken && !isTokenExpired(storedToken)) {
          state.setTokens(storedToken, parsed?.state?.refreshToken || '')
          if (parsed?.state?.profile) state.setProfile(parsed.state.profile)
          return storedToken
        }
      }
    } catch {}
  }

  // 3. Return active in-flight login if one is already running
  if (inFlightAuthPromise) {
    return inFlightAuthPromise
  }

  inFlightAuthPromise = (async () => {
    try {
      // If refresh token exists and not force fresh login, try refresh first (faster than full login)
      const currentRefresh = state.refreshToken
      if (!forceRefresh && currentRefresh && !isTokenExpired(currentRefresh)) {
        try {
          const refreshed = await authApi.refresh({ refresh_token: currentRefresh })
          if (refreshed?.access_token) {
            state.setTokens(refreshed.access_token, refreshed.refresh_token || currentRefresh)
            return refreshed.access_token
          }
        } catch {
          // Fallback to fresh login
        }
      }

      // Attempt auto-login with default superadmin credentials
      const attempts = [
        { username: DEFAULT_API_CREDENTIALS.username, password: DEFAULT_API_CREDENTIALS.password },
        { username: DEFAULT_API_CREDENTIALS.email, password: DEFAULT_API_CREDENTIALS.password },
      ]

      for (const cred of attempts) {
        try {
          const tokens = await authApi.login(cred)
          if (tokens?.access_token) {
            state.setTokens(tokens.access_token, tokens.refresh_token)
            // Fetch profile in background without blocking the token return
            authApi.me(tokens.access_token).then((profile) => {
              if (profile) state.setProfile(profile)
            }).catch(() => {})
            return tokens.access_token
          }
        } catch {
          // Continue to next attempt
        }
      }

      return null
    } finally {
      inFlightAuthPromise = null
    }
  })()

  return inFlightAuthPromise
}
