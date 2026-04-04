import { useState, useEffect } from 'react'
import { updateSettings, getCategories, createCategory, updateCategory, deleteCategory } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import useAuthStore from '../../store/authStore'
import styles from './SettingsModal.module.css'

const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
]

const THEMES = [
  { key: 'dark', color: '#7c6aff' },
  { key: 'light', color: '#6b59e8' },
  { key: 'navy', color: '#58a6ff' },
  { key: 'warm', color: '#f97316' },
]

export default function SettingsModal({ onClose }) {
  const { settings, updateUserSettings } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [tz, setTz] = useState(settings.timezone)
  const [cats, setCats] = useState([])
  const [newCat, setNewCat] = useState({ name: '', color: '#7c6aff', emoji: '📌' })
  const [editCat, setEditCat] = useState(null)
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => { getCategories().then((r) => setCats(r.data)) }, [])

  const saveTz = async () => {
    try {
      await updateSettings({ timezone: tz })
      updateUserSettings({ ...settings, timezone: tz })
      toast.success(t('settings.timezoneUpdated'))
    } catch { toast.error(t('settings.timezoneError')) }
  }

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  const changeTheme = (theme) => {
    document.documentElement.className = theme
    localStorage.setItem('theme', theme)
    setCurrentTheme(theme)
  }

  const addCat = async () => {
    if (!newCat.name) return
    try {
      const r = await createCategory(newCat)
      setCats([...cats, r.data])
      setNewCat({ name: '', color: '#7c6aff', emoji: '📌' })
      toast.success(t('settings.categoryCreated'))
    } catch { toast.error(t('settings.createError')) }
  }

  const saveCat = async () => {
    if (!editCat) return
    try {
      const r = await updateCategory(editCat.id, { name: editCat.name, color: editCat.color, emoji: editCat.emoji })
      setCats(cats.map((c) => c.id === editCat.id ? r.data : c))
      setEditCat(null)
      toast.success(t('settings.categoryUpdated'))
    } catch { toast.error(t('settings.updateError')) }
  }

  const delCat = async (id) => {
    try {
      await deleteCategory(id)
      setCats(cats.filter((c) => c.id !== id))
      toast.success(t('settings.categoryDeleted'))
    } catch { toast.error(t('settings.deleteError')) }
  }

  return (
    <Modal onClose={onClose} title={t('settings.title')} width={480}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.language')}</h3>
        <div className={styles.langRow}>
          {['en', 'ru'].map((lang) => (
            <button
              key={lang}
              className={`${styles.langBtn} ${i18n.language === lang ? styles.active : ''}`}
              onClick={() => changeLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.theme')}</h3>
        <div className={styles.themeRow}>
          {THEMES.map(({ key, color }) => (
            <button
              key={key}
              className={`${styles.themeBtn} ${currentTheme === key ? styles.active : ''}`}
              onClick={() => changeTheme(key)}
              title={t(`settings.theme${key.charAt(0).toUpperCase() + key.slice(1)}`)}
            >
              <span className={styles.themeCircle} style={{ background: color }} />
              <span>{t(`settings.theme${key.charAt(0).toUpperCase() + key.slice(1)}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.timezone')}</h3>
        <div className={styles.tzRow}>
          <select className={styles.select} value={tz} onChange={(e) => setTz(e.target.value)}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <button className={styles.saveBtn} onClick={saveTz}>{t('settings.save')}</button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.categories')}</h3>
        <div className={styles.catList}>
          {cats.map((cat) => (
            editCat?.id === cat.id ? (
              <div key={cat.id} className={styles.catEditRow}>
                <input className={styles.input} value={editCat.emoji} onChange={(e) => setEditCat({ ...editCat, emoji: e.target.value })} style={{ width: 50 }} />
                <input className={styles.input} value={editCat.name} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })} style={{ flex: 1 }} />
                <input type="color" className={styles.colorPicker} value={editCat.color} onChange={(e) => setEditCat({ ...editCat, color: e.target.value })} />
                <button className={styles.saveBtn} onClick={saveCat}>✓</button>
                <button className={styles.iconBtn} onClick={() => setEditCat(null)}>✕</button>
              </div>
            ) : (
              <div key={cat.id} className={styles.catRow}>
                <span className={styles.catDot} style={{ background: cat.color }} />
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catName}>{cat.name}</span>
                <button className={styles.iconBtn} onClick={() => setEditCat({ ...cat })}>✎</button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => delCat(cat.id)}>✕</button>
              </div>
            )
          ))}
        </div>

        <div className={styles.addCatRow}>
          <input className={styles.input} placeholder={t('settings.emojiPlaceholder')} value={newCat.emoji} onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value })} style={{ width: 60 }} />
          <input className={styles.input} placeholder={t('settings.categoryNamePlaceholder')} value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} style={{ flex: 1 }} />
          <input type="color" className={styles.colorPicker} value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
          <button className={styles.saveBtn} onClick={addCat}>{t('settings.add')}</button>
        </div>
      </div>
    </Modal>
  )
}
