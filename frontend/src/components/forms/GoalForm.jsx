import { useState } from 'react'
import { createGoal, updateGoal } from '../../api/client'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import useAuthStore from '../../store/authStore'
import styles from './GoalForm.module.css'

export default function GoalForm({ goal, activities, onClose, onSaved }) {
  const isEdit = !!goal
  const { user } = useAuthStore()

  // Only show activities visible to current user
  const myActivities = activities.filter(
    (a) => a.creator_id === user?.id || a.assigned_user_ids.includes(user?.id)
  )

  const [description, setDescription] = useState(goal?.description ?? '')
  const [selectedIds, setSelectedIds] = useState(goal?.activity_ids ?? [])

  const toggleActivity = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { description, activity_ids: selectedIds }
    try {
      if (isEdit) {
        await updateGoal(goal.id, payload)
        toast.success('Goal updated')
      } else {
        await createGoal(payload)
        toast.success('Goal created')
      }
      onSaved()
    } catch {
      toast.error('Failed to save goal')
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? 'Edit Life Goal' : 'New Life Goal'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="Describe your life goal…"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Link Activities ({selectedIds.length} selected)</label>
          {myActivities.length === 0 ? (
            <p className={styles.empty}>No activities available. Create some in the Tasks tab first.</p>
          ) : (
            <div className={styles.actList}>
              {myActivities.map((a) => (
                <label key={a.id} className={`${styles.actItem} ${selectedIds.includes(a.id) ? styles.selected : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleActivity(a.id)}
                  />
                  <span className={styles.actDesc}>{a.description}</span>
                  {a.completed && <span className={styles.doneBadge}>done</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.saveBtn}>{isEdit ? 'Save Changes' : 'Create Goal'}</button>
        </div>
      </form>
    </Modal>
  )
}
