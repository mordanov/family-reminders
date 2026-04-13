import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import SettingsModal from '../components/ui/SettingsModal'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const { t } = useTranslation()

  const navItems = [
    { to: '/weekly', label: t('nav.weekly'), icon: '▦' },
    { to: '/tasks', label: t('nav.tasks'), icon: '◻' },
    { to: '/nutrition', label: t('nav.nutrition'), icon: '◑' },
    { to: '/payments', label: t('nav.payments'), icon: '◎' },
    { to: '/incidents', label: t('nav.incidents'), icon: '◈' },
    { to: '/medications', label: t('nav.medications'), icon: '◍' },
    { to: '/archive', label: t('nav.archive'), icon: '◫' },
  ]

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
            <span className={styles.settingsBtnLabel}>{t('nav.settings')}</span>
          </button>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <span className={styles.username}>{user?.username}</span>
            <button className={styles.logoutBtn} onClick={handleLogout} title={t('nav.signOut')}>↪</button>
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
