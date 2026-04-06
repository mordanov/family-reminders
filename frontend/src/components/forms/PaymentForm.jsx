import { useState } from 'react'
import { format } from 'date-fns'
import { createPayment, updatePayment } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import styles from './PaymentForm.module.css'

const toDatetimeLocal = (iso) => {
  const d = iso ? new Date(iso) : new Date()
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

const CURRENCIES = ['EUR', 'USD', 'RUB']

export default function PaymentForm({ payment, onClose, onSaved }) {
  const isEdit = !!(payment?.id)
  const { t } = useTranslation()

  const [form, setForm] = useState({
    paid_at: toDatetimeLocal(payment?.paid_at),
    description: payment?.description ?? '',
    currency: payment?.currency ?? 'EUR',
    amount: payment?.amount ?? '',
    lessons_count: payment?.lessons_count ?? '',
    lessons_per_week: payment?.lessons_per_week ?? '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      paid_at: new Date(form.paid_at).toISOString(),
      description: form.description,
      currency: form.currency,
      amount: parseFloat(form.amount),
      lessons_count: parseInt(form.lessons_count, 10),
      lessons_per_week: parseFloat(form.lessons_per_week),
    }
    try {
      if (isEdit) {
        await updatePayment(payment.id, payload)
        toast.success(t('payments.forms.updated'))
      } else {
        await createPayment(payload)
        toast.success(t('payments.forms.created'))
      }
      onSaved()
    } catch {
      toast.error(t('payments.forms.saveError'))
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t('payments.forms.editTitle') : t('payments.forms.newTitle')}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>{t('payments.forms.paidAt')}</label>
          <input type="datetime-local" className={styles.input} value={form.paid_at} onChange={(e) => set('paid_at', e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('payments.forms.description')}</label>
          <textarea className={styles.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} required rows={2} placeholder={t('payments.forms.descriptionPlaceholder')} />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t('payments.forms.currency')}</label>
            <select className={styles.select} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('payments.forms.amount')}</label>
            <input type="number" min="0" step="0.01" className={styles.input} value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t('payments.forms.lessonsCount')}</label>
            <input type="number" min="1" step="1" className={styles.input} value={form.lessons_count} onChange={(e) => set('lessons_count', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('payments.forms.lessonsPerWeek')}</label>
            <input type="number" min="0.5" step="0.5" className={styles.input} value={form.lessons_per_week} onChange={(e) => set('lessons_per_week', e.target.value)} required />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>{t('forms.cancel')}</button>
          <button type="submit" className={styles.saveBtn}>{isEdit ? t('forms.saveChanges') : t('payments.forms.create')}</button>
        </div>
      </form>
    </Modal>
  )
}
