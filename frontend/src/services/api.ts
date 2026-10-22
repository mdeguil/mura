import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 on /auth/login or /auth/register is the answer to the form —
    // wrong password, not an expired session. Redirecting there reloads the
    // page and wipes the error message before it can be shown, which is why
    // a failed sign-in used to look like nothing happened at all.
    const url = error.config?.url ?? ''
    // The two form endpoints by name, not the whole /auth/ prefix:
    // /auth/me answering 401 means the session really is over -- the
    // account was suspended or removed -- and that one must redirect.
    const isSignInAttempt =
      url.startsWith('/auth/login') || url.startsWith('/auth/register')
    const alreadyOnLogin = window.location.pathname === '/login'

    if (error.response?.status === 401 && !isSignInAttempt && !alreadyOnLogin) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
