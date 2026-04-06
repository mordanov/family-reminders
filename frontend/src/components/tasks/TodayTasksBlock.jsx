import { useState } from 'react'
import { format } from 'date-fns'
import { deleteTask } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import TaskForm from '../forms/TaskForm'
import RecurringEditDialog from '../forms/RecurringEditDialog'
import styles from './TodayTasksBlock.module.css'

export default function TodayTasksBlock({ tasks, categories, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { t } = useTranslation()

  const getCat = (id) => categories.find((c) => c.id === id)

  const handleDelete = async (task, scope) => {
    try {
      await deleteTask(task.id, scope)
      toast.success(t('todayTasks.deleted'))
      onRefresh()
    } catch {
      toast.error(t('todayTasks.deleteError'))
    }
    setDeleteTarget(null)
  }

  const handleDeleteClick = (task) => {
    if (task.is_recurring) setDeleteTarget(task)
    else handleDelete(task, 'this')
  }

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>{t('todayTasks.title')}</h2>
        <button className={styles.addBtn} onClick={() => { setEditTask(null); setShowForm(true) }}>{t('todayTasks.add')}</button>
      </div>

      {tasks.length === 0 ? (
        <p className={styles.empty}>{t('todayTasks.empty')}</p>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => {
            const cat = getCat(task.category_id)
            const start = format(new Date(task.start_datetime), 'HH:mm')
            const end = format(new Date(task.end_datetime), 'HH:mm')
            return (
              <div
                key={task.id}
                className={styles.taskCard}
                style={{ borderLeftColor: task.color, '--task-color': task.color }}
              >
                <div className={styles.taskTime}>
                  <span>{start}</span>
                  <span className={styles.timeEnd}>{end}</span>
                </div>
                <div className={styles.taskBody}>
                  <span className={styles.taskDesc}>{task.description}</span>
                  <div className={styles.taskMeta}>
                    {cat && <span className={styles.catBadge}>{cat.emoji} {cat.name}</span>}
                    {task.is_recurring && <span className={styles.recurBadge}>↻ {t('todayTasks.recurring')}</span>}
                    {task.remind_at_start && <span className={styles.reminderBadge}>🔔</span>}
                  </div>
                </div>
                <div className={styles.taskActions}>
                  <button className={styles.actionBtn} onClick={() => { setEditTask(task); setShowForm(true) }}>✎</button>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteClick(task)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editTask}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
          mode="habit"
        />
      )}

      {deleteTarget && (
        <RecurringEditDialog
          action="delete"
          onConfirm={(scope) => handleDelete(deleteTarget, scope)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  )
}
