import { useEffect, useState } from 'react'
import { getGoals, getActivities, deleteGoal, getUsers } from '../api/client'
import toast from 'react-hot-toast'
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

  const refresh = async () => {
    try {
      const [g, a, u] = await Promise.all([getGoals(), getActivities(), getUsers()])
      setGoals(g.data)
      setActivities(a.data)
      setUsers(u.data)
    } catch {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id)
      toast.success('Goal deleted')
      refresh()
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Life Goals</h1>
          <p className={styles.subtitle}>Long-term aspirations powered by activities</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditGoal(null); setShowForm(true) }}>+ New Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◈</div>
          <p>No life goals yet. Start by creating one.</p>
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
