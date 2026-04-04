import { useState, useEffect } from 'react'
import { createActivity, updateActivity, getUsers } from '../../api/client'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import styles from './ActivityForm.module.css'

export default function ActivityForm({ activity, categories, onClose, onSaved }) {
  const isEdit = !!activity
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    description: activity?.description ?? '',
    category_id: activity?.category_id ?? '',
    color: activity?.color ?? '#7c6aff',
    priority: activity?.priority ?? 5,
    assigned_user_ids: activity?.assigned_user_ids ?? [],
  })

  useEffect(() => {
    getUsers().then((r) => setUsers(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleUser = (uid) => {
    set('assigned_user_ids', form.assigned_user_ids.includes(uid)
      ? form.assigned_user_ids.filter((id) => id !== uid)
      : [...form.assigned_user_ids, uid])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, category_id: form.category_id || null, priority: Number(form.priority) }
    try {
      if (isEdit) {
        await updateActivity(activity.id, payload)
        toast.success('Activity updated')
      } else {
        await createActivity(payload)
        toast.success('Activity created')
      }
      onSaved()
    } catch {
      toast.error('Failed to save activity')
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? 'Edit Activity' : 'New Activity'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} required rows={2} placeholder="e.g. Plant cucumbers" />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Priority (1–10)</label>
            <input type="number" min={1} max={10} className={styles.input} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Color</label>
          <div className={styles.colorRow}>
            <input type="color" className={styles.colorPicker} value={form.color} onChange={(e) => set('color', e.target.value)} />
            <span className={styles.colorVal}>{form.color}</span>
          </div>
        </div>

        {users.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Assign to</label>
            <div className={styles.userList}>
              {users.map((u) => (
                <label key={u.id} className={styles.userChip}>
                  <input type="checkbox" checked={form.assigned_user_ids.includes(u.id)} onChange={() => toggleUser(u.id)} />
                  <span>{u.username}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.saveBtn}>{isEdit ? 'Save Changes' : 'Create Activity'}</button>
        </div>
      </form>
    </Modal>
  )
}
