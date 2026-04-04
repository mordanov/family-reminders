import { useEffect, useState } from 'react'
import { getGoals, getActivities, deleteGoal, getUsers } from '../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import GoalCard from '../components/goals/GoalCard'
import GoalForm from '../components/forms/GoalForm'
import styles from './GoalsPage.module.css'

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const { t } = useTranslation()

  const refresh = async () => {
    try {
      const [g, a, u] = await Promise.all([getGoals(), getActivities(), getUsers()])
      setGoals(g.data)
      setActivities(a.data)
      setUsers(u.data)
    } catch {
      toast.error(t('goals.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id)
      toast.success(t('goals.deleted'))
      refresh()
    } catch {
      toast.error(t('goals.deleteError'))
    }
  }

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('goals.title')}</h1>
          <p className={styles.subtitle}>{t('goals.subtitle')}</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditGoal(null); setShowForm(true) }}>{t('goals.add')}</button>
      </div>

      {goals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◈</div>
          <p>{t('goals.empty')}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              activities={activities}
              users={users}
              onEdit={() => { setEditGoal(goal); setShowForm(true) }}
              onDelete={() => handleDelete(goal.id)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editGoal}
          activities={activities}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh() }}
        />
      )}
    </div>
  )
}
