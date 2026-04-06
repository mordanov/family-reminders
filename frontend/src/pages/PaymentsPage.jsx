import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { getPayments, deletePayment } from '../api/client'
import PaymentForm from '../components/forms/PaymentForm'
import styles from './PaymentsPage.module.css'

function calcEndDate(paidAt, lessonsCount, lessonsPerWeek) {
  if (!paidAt || !lessonsCount || !lessonsPerWeek) return null
  const weeks = lessonsCount / lessonsPerWeek
  const end = new Date(paidAt)
  end.setDate(end.getDate() + Math.round(weeks * 7))
  const dow = end.getDay() // 0=Sun..6=Sat
  end.setDate(end.getDate() - (dow - 5 + 7) % 7)
  return end
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState(null)
  const { t, i18n } = useTranslation()

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'

  const load = async () => {
    try {
      const r = await getPayments()
      setPayments(r.data)
    } catch {
      toast.error(t('payments.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    try {
      await deletePayment(id)
      toast.success(t('payments.deleted'))
      setPayments((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error(t('payments.deleteError'))
    }
  }

  const openCreate = () => { setEditPayment(null); setShowForm(true) }
  const openEdit = (p) => { setEditPayment(p); setShowForm(true) }
  const openCopy = (p) => {
    setEditPayment({
      paid_at: new Date().toISOString(),
      description: p.description,
      currency: p.currency,
      amount: p.amount,
      lessons_count: p.lessons_count,
      lessons_per_week: p.lessons_per_week,
      // no id → treated as create
    })
    setShowForm(true)
  }

  const dateHeaderStr = new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.date}>{dateHeaderStr}</div>
        <div className={styles.title}>{t('payments.title')}</div>
      </div>

      <div className={styles.toolbar}>
        <button className={styles.addBtn} onClick={openCreate}>{t('payments.add')}</button>
      </div>

      {payments.length === 0 ? (
        <p className={styles.empty}>{t('payments.empty')}</p>
      ) : (
        <div className={styles.list}>
          {payments.map((p) => {
            const endDate = calcEndDate(p.paid_at, p.lessons_count, p.lessons_per_week)
            const paidDate = new Date(p.paid_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
            const endStr = endDate ? endDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
            return (
              <div key={p.id} className={styles.row}>
                <div className={styles.dateCol}>{paidDate}</div>
                <div className={styles.descCol} title={p.description}>{p.description}</div>
                <div className={styles.amountCol}>{Number(p.amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {p.currency}</div>
                <div className={styles.endDateCol}>
                  <span className={styles.endLabel}>{t('payments.endDate')}</span>
                  <span className={styles.endValue}>{endStr}</span>
                </div>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => openCopy(p)} title={t('payments.copy')}>⊕</button>
                  <button className={styles.actionBtn} onClick={() => openEdit(p)}>✎</button>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(p.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <PaymentForm
          payment={editPayment}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
