import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import styles from './RemindersBlock.module.css'

export default function RemindersBlock({ reminders, categories }) {
  const { t } = useTranslation()
  if (!reminders.length) return null

  const getCat = (id) => categories.find((c) => c.id === id)

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <span className={styles.bellIcon}>🔔</span>
        <h2 className={styles.blockTitle}>{t('reminders.title')}</h2>
        <span className={styles.badge}>{reminders.length}</span>
      </div>
      <div className={styles.list}>
        {reminders.map((task) => {
          const cat = getCat(task.category_id)
          const startTime = format(new Date(task.start_datetime), 'HH:mm')
          return (
            <div key={task.id} className={styles.card} style={{ borderLeftColor: task.color }}>
              <span className={styles.time}>{startTime}</span>
              <span className={styles.emoji}>{cat?.emoji ?? '📌'}</span>
              <span className={styles.desc}>{task.description}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
