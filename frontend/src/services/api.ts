import axios from 'axios'
import { useAuthStore } from '../store/authStore'

/**
 * The HTTP client for the Mura API. It sends the session's token with every
 * request, and signs out and goes to the login page when the server answers
 * 401 -- except on the sign-in and registration forms, where a 401 is the
 * answer to the form.
 */
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
    const url = error.config?.url ?? ''
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
