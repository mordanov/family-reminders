import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import MainLayout from './pages/MainLayout'
import TasksPage from './pages/TasksPage'
import GoalsPage from './pages/GoalsPage'
import WeeklyPage from './pages/WeeklyPage'

function PrivateRoute({ children }) {
  const { token, user, loading } = useAuthStore()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading…</div>
  if (!token || !user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { fetchMe, token } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
    else useAuthStore.setState({ loading: false })
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font)',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="weekly" element={<WeeklyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
