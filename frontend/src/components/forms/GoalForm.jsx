import { useState } from 'react'
import { createGoal, updateGoal } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import useAuthStore from '../../store/authStore'
import styles from './GoalForm.module.css'

export default function GoalForm({ goal, activities, onClose, onSaved }) {
  const isEdit = !!goal
  const { t } = useTranslation()
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
        toast.success(t('forms.goal.updated'))
      } else {
        await createGoal(payload)
        toast.success(t('forms.goal.created'))
      }
      onSaved()
    } catch {
      toast.error(t('forms.goal.saveError'))
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t('forms.goal.editTitle') : t('forms.goal.newTitle')}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>{t('forms.goal.description')}</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder={t('forms.goal.descriptionPlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            {selectedIds.length > 0
              ? t('forms.goal.linkActivitiesCount', { count: selectedIds.length })
              : t('forms.goal.linkActivities')}
          </label>
          {myActivities.length === 0 ? (
            <p className={styles.empty}>{t('forms.goal.noActivities')}</p>
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
                  {a.completed && <span className={styles.doneBadge}>{t('forms.goal.done')}</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>{t('forms.cancel')}</button>
          <button type="submit" className={styles.saveBtn}>{isEdit ? t('forms.saveChanges') : t('forms.goal.create')}</button>
        </div>
      </form>
    </Modal>
  )
}
