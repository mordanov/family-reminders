import { useState } from 'react'
import { copyGoal } from '../../api/client'
import toast from 'react-hot-toast'
import styles from './GoalCard.module.css'

export default function GoalCard({ goal, activities, users, onEdit, onDelete, onRefresh }) {
  const [showCopy, setShowCopy] = useState(false)
  const [copyTarget, setCopyTarget] = useState('')

  const linkedActivities = activities.filter((a) => goal.activity_ids.includes(a.id))

  const handleCopy = async () => {
    if (!copyTarget) return
    try {
      await copyGoal(goal.id, Number(copyTarget))
      toast.success('Goal copied!')
      setShowCopy(false)
      onRefresh()
    } catch {
      toast.error('Failed to copy goal')
    }
  }

  const progressColor =
    goal.progress >= 75 ? 'var(--success)' :
    goal.progress >= 40 ? 'var(--warning)' :
    'var(--accent)'

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <p className={styles.desc}>{goal.description}</p>
        <div className={styles.cardActions}>
          <button className={styles.iconBtn} onClick={onEdit} title="Edit">✎</button>
          <button className={styles.iconBtn} onClick={() => setShowCopy(!showCopy)} title="Copy to user">⎘</button>
          <button className={`${styles.iconBtn} ${styles.danger}`} onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressPct} style={{ color: progressColor }}>{goal.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${goal.progress}%`, background: progressColor }} />
        </div>
      </div>

      <div className={styles.actCount}>
        <span className={styles.actIcon}>◻</span>
        <span>{goal.activity_count} {goal.activity_count === 1 ? 'activity' : 'activities'}</span>
      </div>

      {linkedActivities.length > 0 && (
        <div className={styles.actList}>
          {linkedActivities.slice(0, 4).map((a) => (
            <div key={a.id} className={`${styles.actChip} ${a.completed ? styles.done : ''}`}>
              {a.completed ? '✓' : '○'} {a.description}
            </div>
          ))}
          {linkedActivities.length > 4 && (
            <div className={styles.actMore}>+{linkedActivities.length - 4} more</div>
          )}
        </div>
      )}

      {showCopy && (
        <div className={styles.copyRow}>
          <select className={styles.select} value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)}>
            <option value="">Select user…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
          <button className={styles.copyBtn} onClick={handleCopy} disabled={!copyTarget}>Copy</button>
          <button className={styles.iconBtn} onClick={() => setShowCopy(false)}>✕</button>
        </div>
      )}
    </div>
  )
}
