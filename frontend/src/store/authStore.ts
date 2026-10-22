import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '../types'

interface AuthState {
  token: string | null
  user: Account | null
  setAuth: (token: string, user: Account) => void
  // The account alone, for refreshing what the server says about it without
  // touching the token: a role can have been granted or taken away since
  // this session signed in.
  setUser: (user: Account) => void
  logout: () => void
}

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
