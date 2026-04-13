import { useEffect, useState } from 'react'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  deleteMedicationPeriod,
  getMedicationPeriod,
  getMedicationPeriods,
  upsertMedicationLog,
} from '../api/client'
import PeriodForm from '../components/medications/PeriodForm'
import styles from './MedicationsPage.module.css'

const TODAY = format(new Date(), 'yyyy-MM-dd')

function computeStats(period, logs) {
  const days = eachDayOfInterval({
    start: parseISO(period.start_date),
    end: parseISO(period.end_date),
  })
  const logMap = {}
  logs.forEach((log) => {
    logMap[`${log.intake_id}_${log.date}`] = log.taken
  })

  let completedDays = 0, missedDays = 0, partialDays = 0, pillsTaken = 0
  const n = period.intakes.length

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    let takenCount = 0
    period.intakes.forEach((intake) => {
      const taken = logMap[`${intake.id}_${dateStr}`] ?? false
      if (taken) {
        takenCount++
        intake.items.forEach((item) => { pillsTaken += item.pill_count })
      }
    })
    if (n === 0 || takenCount === n) completedDays++
    else if (takenCount === 0) missedDays++
    else partialDays++
  })

  return { completedDays, missedDays, partialDays, pillsTaken, totalDays: days.length }
}

export default function MedicationsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'

  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [logs, setLogs] = useState({})
  const [showForm, setShowForm] = useState(false)

  const loadPeriods = async () => {
    try {
      const res = await getMedicationPeriods()
      setPeriods(res.data)
    } catch {
      toast.error(t('medications.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPeriods() }, [])

  const openDetail = async (period) => {
    setDetailLoading(true)
    try {
      const res = await getMedicationPeriod(period.id)
      const d = res.data
      const logMap = {}
      d.logs.forEach((log) => { logMap[`${log.intake_id}_${log.date}`] = log.taken })
      setDetail(d)
      setLogs(logMap)
    } catch {
      toast.error(t('medications.loadError'))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (e, periodId) => {
    e.stopPropagation()
    if (!window.confirm(t('medications.deleteConfirm'))) return
    try {
      await deleteMedicationPeriod(periodId)
      toast.success(t('medications.deleted'))
      setPeriods((ps) => ps.filter((p) => p.id !== periodId))
      if (detail?.id === periodId) setDetail(null)
    } catch {
      toast.error(t('medications.deleteError'))
    }
  }

  const handleToggle = async (intakeId, dateStr) => {
    const key = `${intakeId}_${dateStr}`
    const newTaken = !(logs[key] ?? false)
    setLogs((prev) => ({ ...prev, [key]: newTaken }))
    try {
      await upsertMedicationLog({ intake_id: intakeId, date: dateStr, taken: newTaken })
    } catch {
      setLogs((prev) => ({ ...prev, [key]: !newTaken }))
      toast.error(t('medications.saveError'))
    }
  }

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (detail) {
    const days = eachDayOfInterval({
      start: parseISO(detail.start_date),
      end: parseISO(detail.end_date),
    })
    const stats = detail.is_closed ? computeStats(detail, detail.logs) : null

    return (
      <div className={styles.root}>
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => setDetail(null)}>
            {t('medications.backToList')}
          </button>
          <div className={styles.detailTitleRow}>
            <span className={styles.detailName}>{detail.name}</span>
            <span className={detail.is_closed ? styles.badgeClosed : styles.badgeActive}>
              {detail.is_closed ? t('medications.closed') : t('medications.active')}
            </span>
          </div>
          <div className={styles.detailDates}>
            {detail.start_date} — {detail.end_date}
          </div>
        </div>

        {stats && (
          <div className={styles.statsBar}>
            <div className={styles.statChip}>
              <span className={styles.statValue}>{stats.completedDays}</span>
              <span className={styles.statLabel}>{t('medications.stats.completed')}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statValue}>{stats.partialDays}</span>
              <span className={styles.statLabel}>{t('medications.stats.partial')}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statValue}>{stats.missedDays}</span>
              <span className={styles.statLabel}>{t('medications.stats.missed')}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statValue}>{stats.pillsTaken}</span>
              <span className={styles.statLabel}>{t('medications.stats.pillsTaken')}</span>
            </div>
          </div>
        )}

        <div className={styles.calendarWrap}>
          <table className={styles.calendarTable}>
            <thead>
              <tr>
                <th className={styles.thDate} />
                {detail.intakes.map((intake) => (
                  <th key={intake.id} className={styles.thIntake}>
                    <div className={styles.intakeHeaderName}>{intake.name}</div>
                    <div className={styles.intakeItems}>
                      {intake.items.map((item) => (
                        <span key={item.id} className={styles.itemBadge}>
                          {item.name} ×{item.pill_count}
                        </span>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isToday = dateStr === TODAY
                return (
                  <tr key={dateStr} className={isToday ? styles.rowToday : ''}>
                    <td className={styles.tdDate}>
                      {day.toLocaleDateString(locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    {detail.intakes.map((intake) => {
                      const taken = logs[`${intake.id}_${dateStr}`] ?? false
                      return (
                        <td key={intake.id} className={styles.tdCell}>
                          <button
                            className={`${styles.toggleBtn} ${taken ? styles.toggleTaken : ''}`}
                            onClick={() => handleToggle(intake.id, dateStr)}
                            title={taken ? t('medications.markUntaken') : t('medications.markTaken')}
                          >
                            {taken ? '✓' : '○'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <div className={styles.listHeader}>
        <h1 className={styles.title}>{t('medications.title')}</h1>
        <button className={styles.newBtn} onClick={() => setShowForm(true)}>
          {t('medications.newPeriod')}
        </button>
      </div>

      {detailLoading && <div className={styles.loading}>{t('common.loading')}</div>}

      {!detailLoading && periods.length === 0 && (
        <p className={styles.empty}>{t('medications.empty')}</p>
      )}

      <div className={styles.periodList}>
        {periods.map((period) => (
          <div
            key={period.id}
            className={styles.periodCard}
            onClick={() => openDetail(period)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openDetail(period)}
          >
            <div className={styles.cardTop}>
              <span className={styles.periodName}>{period.name}</span>
              <span className={period.is_closed ? styles.badgeClosed : styles.badgeActive}>
                {period.is_closed ? t('medications.closed') : t('medications.active')}
              </span>
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.dateRange}>
                {period.start_date} — {period.end_date}
              </span>
              <span className={styles.intakeCount}>
                {period.intakes.length} {t('medications.intakes')}
              </span>
            </div>
            {period.intakes.length > 0 && (
              <div className={styles.cardIntakes}>
                {period.intakes.map((intake) => (
                  <span key={intake.id} className={styles.intakeTag}>
                    {intake.name}
                  </span>
                ))}
              </div>
            )}
            <button
              className={styles.deleteBtn}
              onClick={(e) => handleDelete(e, period.id)}
              title={t('medications.deleteConfirm')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <PeriodForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadPeriods() }}
        />
      )}
    </div>
  )
}
