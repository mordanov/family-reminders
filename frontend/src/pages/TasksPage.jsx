import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { format, addDays, isToday } from 'date-fns'
import { getTodayTasks, getActivities, getReminders, getCategories, getIncidents } from '../api/client'
import TodayTasksBlock from '../components/tasks/TodayTasksBlock'
import ActivitiesBlock from '../components/activities/ActivitiesBlock'
import RemindersBlock from '../components/tasks/RemindersBlock'
import IncidentsBlock from '../components/tasks/IncidentsBlock'
import styles from './TasksPage.module.css'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [reminders, setReminders] = useState([])
  const [incidents, setIncidents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const { t, i18n } = useTranslation()

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'

  const refresh = async (date = currentDate) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const isCurrentDay = dateStr === todayStr

      const [tk, a, r, c, i] = await Promise.all([
        getTodayTasks(isCurrentDay ? undefined : dateStr),
        getActivities(),
        getReminders(),
        getCategories(),
        getIncidents(),
      ])
      setTasks(tk.data)
      setActivities(a.data)
      setReminders(r.data)
      setCategories(c.data)
      setIncidents(i.data)
    } catch {
      toast.error(t('tasks.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh(currentDate)
  }, [currentDate])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await getReminders()
        setReminders(r.data)
      } catch {}
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const goDay = (delta) => setCurrentDate((d) => addDays(d, delta))
  const goToday = () => setCurrentDate(new Date())

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.dateRow}>
          <button className={styles.navBtn} onClick={() => goDay(-1)}>‹</button>
          <div className={styles.dateCenter}>
            <div className={styles.date}>
              {currentDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {!isToday(currentDate) && (
              <button className={styles.todayBtn} onClick={goToday}>
                {locale === 'ru-RU' ? 'Сегодня' : 'Today'}
              </button>
            )}
          </div>
          <button className={styles.navBtn} onClick={() => goDay(1)}>›</button>
        </div>
        <div className={styles.datePickerRow}>
          <input
            type="date"
            className={styles.datePicker}
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setCurrentDate(new Date(e.target.value + 'T12:00:00'))}
          />
        </div>
        <h1 className={styles.title}>{t('tasks.title')}</h1>
      </div>

      <div className={styles.blocks}>
        <RemindersBlock reminders={reminders} categories={categories} />
        <ActivitiesBlock activities={activities} categories={categories} onRefresh={() => refresh(currentDate)} />
        <TodayTasksBlock tasks={tasks} categories={categories} onRefresh={() => refresh(currentDate)} />
        <IncidentsBlock incidents={incidents} onRefresh={() => refresh(currentDate)} />
      </div>
    </div>
  )
}
