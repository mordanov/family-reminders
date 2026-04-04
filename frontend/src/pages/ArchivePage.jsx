import { useState, useEffect } from 'react'
import { format, subMonths } from 'date-fns'
import { getArchivedTasks, getArchivedActivities, getCategories } from '../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import styles from './ArchivePage.module.css'

const toDateInput = (d) => format(d, 'yyyy-MM-dd')

export default function ArchivePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('tasks')
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')

  const [startDate, setStartDate] = useState(toDateInput(subMonths(new Date(), 1)))
  const [endDate, setEndDate] = useState(toDateInput(new Date()))

  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const r = await getArchivedTasks({
        start_date: startDate,
        end_date: endDate,
        category_id: categoryId || undefined,
      })
      setTasks(r.data)
    } catch {
      toast.error(t('archive.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      const r = await getArchivedActivities({
        category_id: categoryId || undefined,
      })
      setActivities(r.data)
    } catch {
      toast.error(t('archive.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'tasks') loadTasks()
    else loadActivities()
  }, [tab])

  const handleApply = () => {
    if (tab === 'tasks') loadTasks()
    else loadActivities()
  }

  const getCat = (id) => categories.find((c) => c.id === id)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('archive.title')}</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'tasks' ? styles.active : ''}`}
          onClick={() => setTab('tasks')}
        >
          {t('archive.tasksTab')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'activities' ? styles.active : ''}`}
          onClick={() => setTab('activities')}
        >
          {t('archive.activitiesTab')}
        </button>
      </div>

      <div className={styles.filters}>
        {tab === 'tasks' && (
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>{t('archive.startDate')}</label>
              <input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>{t('archive.endDate')}</label>
              <input type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </>
        )}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('archive.category')}</label>
          <select className={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{t('archive.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>
        <button className={styles.applyBtn} onClick={handleApply}>{t('archive.apply')}</button>
      </div>

      {loading ? (
        <div className={styles.loading}>{t('common.loading')}</div>
      ) : tab === 'tasks' ? (
        tasks.length === 0 ? (
          <p className={styles.empty}>{t('archive.noTasks')}</p>
        ) : (
          <div className={styles.list}>
            {tasks.map((task) => {
              const cat = getCat(task.category_id)
              return (
                <div key={task.id} className={styles.taskRow} style={{ borderLeftColor: task.color }}>
                  <span className={styles.time}>
                    {format(new Date(task.start_datetime), 'dd.MM.yyyy HH:mm')}
                  </span>
                  <span className={styles.desc}>{task.description}</span>
                  {cat && <span className={styles.catBadge}>{cat.emoji} {cat.name}</span>}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          <h2 className={styles.sectionTitle}>{t('archive.completedActivities')}</h2>
          {activities.length === 0 ? (
            <p className={styles.empty}>{t('archive.noActivities')}</p>
          ) : (
            <div className={styles.list}>
              {activities.map((act) => {
                const cat = getCat(act.category_id)
                return (
                  <div key={act.id} className={styles.actRow} style={{ borderLeftColor: act.color }}>
                    <span className={styles.checkIcon}>✓</span>
                    <span className={styles.desc}>{act.description}</span>
                    {cat && <span className={styles.catBadge}>{cat.emoji} {cat.name}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
