import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getTodayTasks, getActivities, getReminders, getCategories } from '../api/client'
import TodayTasksBlock from '../components/tasks/TodayTasksBlock'
import ActivitiesBlock from '../components/activities/ActivitiesBlock'
import RemindersBlock from '../components/tasks/RemindersBlock'
import styles from './TasksPage.module.css'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [reminders, setReminders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const [t, a, r, c] = await Promise.all([
        getTodayTasks(), getActivities(), getReminders(), getCategories()
      ])
      setTasks(t.data)
      setActivities(a.data)
      setReminders(r.data)
      setCategories(c.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // Poll reminders every 60 seconds
    const interval = setInterval(async () => {
      try {
        const r = await getReminders()
        setReminders(r.data)
      } catch {}
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <span className={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className={styles.blocks}>
        <RemindersBlock reminders={reminders} categories={categories} />
        <TodayTasksBlock tasks={tasks} categories={categories} onRefresh={refresh} />
        <ActivitiesBlock activities={activities} categories={categories} onRefresh={refresh} />
      </div>
    </div>
  )
}
