import { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getWeekTasks, getCategories } from '../api/client'
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import toast from 'react-hot-toast'
import TaskForm from '../components/forms/TaskForm'
import styles from './WeeklyPage.module.css'

export default function WeeklyPage() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [initialDate, setInitialDate] = useState(null)
  const calRef = useRef(null)

  const loadWeek = async (start, end) => {
    try {
      const [t, c] = await Promise.all([getWeekTasks(start, end), getCategories()])
      setCategories(c.data)
      const evts = t.data.map((task) => ({
        id: String(task.id),
        title: task.description,
        start: task.start_datetime,
        end: task.end_datetime,
        backgroundColor: task.color,
        borderColor: 'transparent',
        extendedProps: { task, category: c.data.find((cat) => cat.id === task.category_id) },
      }))
      setEvents(evts)
    } catch {
      toast.error('Failed to load schedule')
    }
  }

  useEffect(() => {
    const now = new Date()
    loadWeek(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }))
  }, [])

  const handleDatesSet = (info) => {
    loadWeek(info.start, info.end)
  }

  const handleDateClick = (info) => {
    setInitialDate(info.dateStr)
    setShowForm(true)
  }

  const renderEventContent = (eventInfo) => {
    const { category } = eventInfo.event.extendedProps
    return (
      <div className={styles.eventInner}>
        <span className={styles.eventEmoji}>{category?.emoji ?? '📌'}</span>
        <span className={styles.eventTitle}>{eventInfo.event.title}</span>
        {eventInfo.event.extendedProps.task?.is_recurring && (
          <span className={styles.recurIcon}>↻</span>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Weekly Schedule</h1>
        <button className={styles.addBtn} onClick={() => { setInitialDate(null); setShowForm(true) }}>+ Add Task</button>
      </div>

      <div className={styles.calWrap}>
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay,dayGridMonth',
          }}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          nowIndicator
          height="calc(100vh - 140px)"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {showForm && (
        <TaskForm
          task={null}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            const api = calRef.current?.getApi()
            if (api) {
              const start = api.view.activeStart
              const end = api.view.activeEnd
              loadWeek(start, end)
            }
          }}
        />
      )}
    </div>
  )
}
