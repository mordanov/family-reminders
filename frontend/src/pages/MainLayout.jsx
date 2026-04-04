import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../store/authStore'
import SettingsModal from '../components/ui/SettingsModal'
import styles from './MainLayout.module.css'

const navItems = [
  { to: '/tasks', label: 'Tasks', icon: '◻' },
  { to: '/goals', label: 'Life Goals', icon: '◈' },
  { to: '/weekly', label: 'Weekly', icon: '▦' },
]

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◎</span>
          <span className={styles.brandName}>Reminders</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.bottom}>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(true)}>
            <span>⚙</span>
            <span>Settings</span>
          </button>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <span className={styles.username}>{user?.username}</span>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">↪</button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
