import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const switchLang = (l) => {
    i18n.changeLanguage(l)
    localStorage.setItem('lang', l)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    localStorage.setItem('remember_me', String(rememberMe))
    setLoading(true)
    try {
      await login(username, password, rememberMe)
      navigate('/tasks')
    } catch {
      toast.error(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◎</span>
          <span className={styles.logoText}>Reminders</span>
        </div>
        <p className={styles.subtitle}>{t('login.subtitle')}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t('login.username')}</label>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.usernamePlaceholder')}
              autoFocus
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('login.password')}</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <label className={styles.rememberRow}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('login.rememberMe')}</span>
          </label>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p className={styles.hint}>{t('login.hint')}</p>
        <div className={styles.langRow}>
          {['en', 'ru'].map((l) => (
            <button
              key={l}
              type="button"
              className={`${styles.langBtn} ${i18n.language === l ? styles.langBtnActive : ''}`}
              onClick={() => switchLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
