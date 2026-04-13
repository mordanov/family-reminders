import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import MainLayout from './pages/MainLayout'
import TasksPage from './pages/TasksPage'
import NutritionPage from './pages/NutritionPage'
import PaymentsPage from './pages/PaymentsPage'
import GoalsPage from './pages/GoalsPage'
import WeeklyPage from './pages/WeeklyPage'
import ArchivePage from './pages/ArchivePage'
import IncidentsPage from './pages/IncidentsPage'
import MedicationsPage from './pages/MedicationsPage'

function PrivateRoute({ children }) {
  const { token, user, loading } = useAuthStore()
  const { t } = useTranslation()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
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
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="weekly" element={<WeeklyPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="medications" element={<MedicationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
