import { useState, useEffect } from 'react'
import { updateSettings, getCategories, createCategory, updateCategory, deleteCategory } from '../../api/client'
import toast from 'react-hot-toast'
import Modal from './Modal'
import useAuthStore from '../../store/authStore'
import styles from './SettingsModal.module.css'

const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
]

export default function SettingsModal({ onClose }) {
  const { settings, updateUserSettings } = useAuthStore()
  const [tz, setTz] = useState(settings.timezone)
  const [cats, setCats] = useState([])
  const [newCat, setNewCat] = useState({ name: '', color: '#7c6aff', emoji: '📌' })
  const [editCat, setEditCat] = useState(null)

  useEffect(() => { getCategories().then((r) => setCats(r.data)) }, [])

  const saveTz = async () => {
    try {
      await updateSettings({ timezone: tz })
      updateUserSettings({ ...settings, timezone: tz })
      toast.success('Timezone updated')
    } catch { toast.error('Failed to update timezone') }
  }

  const addCat = async () => {
    if (!newCat.name) return
    try {
      const r = await createCategory(newCat)
      setCats([...cats, r.data])
      setNewCat({ name: '', color: '#7c6aff', emoji: '📌' })
      toast.success('Category created')
    } catch { toast.error('Failed to create category') }
  }

  const saveCat = async () => {
    if (!editCat) return
    try {
      const r = await updateCategory(editCat.id, { name: editCat.name, color: editCat.color, emoji: editCat.emoji })
      setCats(cats.map((c) => c.id === editCat.id ? r.data : c))
      setEditCat(null)
      toast.success('Category updated')
    } catch { toast.error('Failed to update') }
  }

  const delCat = async (id) => {
    try {
      await deleteCategory(id)
      setCats(cats.filter((c) => c.id !== id))
      toast.success('Category deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <Modal onClose={onClose} title="Settings" width={480}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Timezone</h3>
        <div className={styles.tzRow}>
          <select className={styles.select} value={tz} onChange={(e) => setTz(e.target.value)}>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className={styles.saveBtn} onClick={saveTz}>Save</button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Categories</h3>
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
          <input className={styles.input} placeholder="emoji" value={newCat.emoji} onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value })} style={{ width: 60 }} />
          <input className={styles.input} placeholder="Category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} style={{ flex: 1 }} />
          <input type="color" className={styles.colorPicker} value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
          <button className={styles.saveBtn} onClick={addCat}>Add</button>
        </div>
      </div>
    </Modal>
  )
}
