import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import GroupPage from './pages/GroupPage'
import DirectoryPage from './pages/DirectoryPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LegalNoticePage from './pages/LegalNoticePage'
import PrivacyPage from './pages/PrivacyPage'
import AccountPage from './pages/AccountPage'
import LegalLinks from './components/LegalLinks'
import api from './services/api'
import { useAuthStore } from './store/authStore'
import type { Account } from './types'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) return <Navigate to="/login" replace />
  if (user && !user.emailVerified) return <VerifyEmailPage />
  return (
    <>
      {children}
      <footer className="bg-app py-6">
        <LegalLinks />
      </footer>
    </>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user?.accountRole === 'ADMIN' ? <>{children}</> : <Navigate to="/projets" replace />
}

function useAccountRefresh() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    api
      .get<Account>('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [token, setUser])
}

/**
 * The application: its routes, and which of them need a signed-in account,
 * a confirmed address or the administrator role. The account is read again
 * from the server on load, so a role taken away since sign-in reads as
 * taken away.
 */
export default function App() {
  useAccountRefresh()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/mentions-legales" element={<LegalNoticePage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/compte" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/projets" replace />} />
        <Route path="/projets" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/carnet" element={<PrivateRoute><DirectoryPage /></PrivateRoute>} />
        <Route path="/administration" element={<PrivateRoute><AdminRoute><AdminPage /></AdminRoute></PrivateRoute>} />
        <Route path="/project/:id" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
        <Route path="/groupe/:id" element={<PrivateRoute><GroupPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
