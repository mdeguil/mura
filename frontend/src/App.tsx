import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import DirectoryPage from './pages/DirectoryPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import api from './services/api'
import { useAuthStore } from './store/authStore'
import type { Account } from './types'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// The role is checked again on the server for every call this page makes;
// this only decides whether showing the page is worth the trip.
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user?.accountRole === 'ADMIN' ? <>{children}</> : <Navigate to="/projets" replace />
}

// What the browser stored at sign-in is a snapshot; a role can have been
// granted or taken away since. Asking the server once on load keeps the
// navigation honest — the server refuses either way, but a tab that is
// about to 403 should not be on screen.
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
      // A failure here is already handled: an expired or revoked token is
      // sent to the login page by the response interceptor.
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [token, setUser])
}

export default function App() {
  useAccountRefresh()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* The list lives at a name of its own, beside /carnet. The bare
            root still works: a bookmark should not break because the
            address got a name. */}
        <Route path="/" element={<Navigate to="/projets" replace />} />
        <Route path="/projets" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/carnet" element={<PrivateRoute><DirectoryPage /></PrivateRoute>} />
        <Route path="/administration" element={<PrivateRoute><AdminRoute><AdminPage /></AdminRoute></PrivateRoute>} />
        <Route path="/project/:id" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
