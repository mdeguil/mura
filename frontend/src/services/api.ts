import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { currentLanguage } from '../i18n'

/**
 * The HTTP client for the Mura API. It sends the session's token with every
 * request, and signs out and goes to the login page when the server answers
 * 401 -- except on the sign-in and registration forms, where a 401 is the
 * answer to the form.
 *
 * The API is reached at `/api` on the page's own origin: nginx forwards it
 * to the backend in an install, and the Vite dev server does the same in
 * development. `VITE_API_URL` overrides it only for an API served elsewhere.
 * Every request says which language the interface is in, so the server
 * answers its error messages in that language.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = currentLanguage()
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
