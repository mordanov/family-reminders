import { useState } from 'react'
import { updateActivity, deleteActivity } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ActivityForm from '../forms/ActivityForm'
import styles from './ActivitiesBlock.module.css'

export default function ActivitiesBlock({ activities, categories, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editActivity, setEditActivity] = useState(null)
  const { t } = useTranslation()

  const getCat = (id) => categories.find((c) => c.id === id)

  const toggleComplete = async (act) => {
    try {
      await updateActivity(act.id, { completed: !act.completed })
      onRefresh()
    } catch {
      toast.error(t('activities.updateError'))
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id)
      toast.success(t('activities.deleted'))
      onRefresh()
    } catch {
      toast.error(t('activities.deleteError'))
    }
  }

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>{t('activities.title')}</h2>
        <button className={styles.addBtn} onClick={() => { setEditActivity(null); setShowForm(true) }}>{t('activities.add')}</button>
      </div>

      {activities.length === 0 ? (
        <p className={styles.empty}>{t('activities.empty')}</p>
      ) : (
        <div className={styles.list}>
          {activities.map((act) => {
            const cat = getCat(act.category_id)
            return (
              <div
                key={act.id}
                className={`${styles.card} ${act.completed ? styles.completed : ''}`}
                style={{ borderLeftColor: act.color }}
              >
                <button
                  className={`${styles.checkBtn} ${act.completed ? styles.checked : ''}`}
                  onClick={() => toggleComplete(act)}
                  title={act.completed ? t('activities.markIncomplete') : t('activities.markComplete')}
                >
                  {act.completed ? '✓' : '○'}
                </button>

                <div className={styles.body}>
                  <span className={styles.desc}>{act.description}</span>
                  <div className={styles.meta}>
                    {cat && <span className={styles.catBadge}>{cat.emoji} {cat.name}</span>}
                    <span className={styles.priority} title="Priority">P{act.priority}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => { setEditActivity(act); setShowForm(true) }}>✎</button>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(act.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ActivityForm
          activity={editActivity}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}
    </section>
  )
}
