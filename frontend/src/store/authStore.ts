import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '../types'

interface AuthState {
  /** The JWT sent with every request, or null when signed out. */
  token: string | null
  /** The signed-in account, or null when signed out. */
  user: Account | null
  /** Signs in: keeps the token and the account. */
  setAuth: (token: string, user: Account) => void
  /**
   * Replaces the account alone, for refreshing what the server says about
   * it without touching the token: a role can have been granted or taken
   * away since this session signed in.
   */
  setUser: (user: Account) => void
  /** Signs out: forgets the token and the account. */
  logout: () => void
}

/**
 * The session: the token and the account it belongs to. Kept in the
 * browser's localStorage under `mura-auth`, so a reload stays signed in.
 * `services/api.ts` calls `logout` when the server answers 401.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'mura-auth' }
  )
)
