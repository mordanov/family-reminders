import { useState } from 'react'
import { createTask, updateTask } from '../../api/client'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import RecurringEditDialog from './RecurringEditDialog'
import { format, addHours, startOfHour } from 'date-fns'
import styles from './TaskForm.module.css'

const toDatetimeLocal = (d) => {
  const dt = d ? new Date(d) : addHours(startOfHour(new Date()), 1)
  return format(dt, "yyyy-MM-dd'T'HH:mm")
}

const FREQS = ['daily', 'weekly', 'monthly', 'yearly']

export default function TaskForm({ task, categories, onClose, onSaved }) {
  const isEdit = !!task
  const { t } = useTranslation()
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [pendingData, setPendingData] = useState(null)

  const [form, setForm] = useState({
    description: task?.description ?? '',
    start_datetime: toDatetimeLocal(task?.start_datetime),
    end_datetime: toDatetimeLocal(task?.end_datetime ?? (task ? null : addHours(startOfHour(new Date()), 2))),
    remind_at_start: task?.remind_at_start ?? false,
    category_id: task?.category_id ?? '',
    color: task?.color ?? '#7c6aff',
    is_recurring: task?.is_recurring ?? false,
    recurring_frequency: task?.recurring_rule?.frequency ?? 'daily',
    recurring_interval: task?.recurring_rule?.interval ?? 1,
    recurring_days_of_week: task?.recurring_rule?.days_of_week ?? '',
    recurring_end_date: task?.recurring_rule?.end_date ? format(new Date(task.recurring_rule.end_date), 'yyyy-MM-dd') : '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const buildPayload = () => {
    const payload = {
      description: form.description,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: new Date(form.end_datetime).toISOString(),
      remind_at_start: form.remind_at_start,
      category_id: form.category_id || null,
      color: form.color,
      is_recurring: form.is_recurring,
    }
    if (form.is_recurring) {
      payload.recurring_rule = {
        frequency: form.recurring_frequency,
        interval: Number(form.recurring_interval),
        days_of_week: form.recurring_days_of_week || null,
        end_date: form.recurring_end_date ? new Date(form.recurring_end_date).toISOString() : null,
      }
    }
    return payload
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = buildPayload()
    if (isEdit && task.is_recurring) {
      setPendingData(payload)
      setShowRecurringDialog(true)
    } else {
      doSave(payload, 'this')
    }
  }

  const doSave = async (payload, scope) => {
    try {
      if (isEdit) {
        await updateTask(task.id, payload, scope)
        toast.success(t('forms.task.updated'))
      } else {
        await createTask(payload)
        toast.success(t('forms.task.created'))
      }
      onSaved()
    } catch {
      toast.error(t('forms.task.saveError'))
    }
  }

  return (
    <>
      <Modal onClose={onClose} title={isEdit ? t('forms.task.editTitle') : t('forms.task.newTitle')}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t('forms.task.description')}</label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              rows={2}
              placeholder={t('forms.task.descriptionPlaceholder')}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('forms.task.start')}</label>
              <input type="datetime-local" className={styles.input} value={form.start_datetime} onChange={(e) => set('start_datetime', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('forms.task.end')}</label>
              <input type="datetime-local" className={styles.input} value={form.end_datetime} onChange={(e) => set('end_datetime', e.target.value)} required />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('forms.task.category')}</label>
              <select className={styles.select} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">{t('forms.task.categoryNone')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('forms.task.color')}</label>
              <div className={styles.colorRow}>
                <input type="color" className={styles.colorPicker} value={form.color} onChange={(e) => set('color', e.target.value)} />
                <span className={styles.colorVal}>{form.color}</span>
              </div>
            </div>
          </div>

          <div className={styles.checkRow}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.remind_at_start} onChange={(e) => set('remind_at_start', e.target.checked)} />
              <span>🔔 {t('forms.task.remindAtStart')}</span>
            </label>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.is_recurring} onChange={(e) => set('is_recurring', e.target.checked)} />
              <span>↻ {t('forms.task.recurring')}</span>
            </label>
          </div>

          {form.is_recurring && (
            <div className={styles.recurBox}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('forms.task.frequency')}</label>
                  <select className={styles.select} value={form.recurring_frequency} onChange={(e) => set('recurring_frequency', e.target.value)}>
                    {FREQS.map((f) => <option key={f} value={f}>{t(`forms.task.frequency${f.charAt(0).toUpperCase() + f.slice(1)}`)}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('forms.task.everyN')}</label>
                  <input type="number" min={1} max={99} className={styles.input} value={form.recurring_interval} onChange={(e) => set('recurring_interval', e.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('forms.task.endDate')}</label>
                <input type="date" className={styles.input} value={form.recurring_end_date} onChange={(e) => set('recurring_end_date', e.target.value)} />
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>{t('forms.cancel')}</button>
            <button type="submit" className={styles.saveBtn}>{isEdit ? t('forms.saveChanges') : t('forms.task.create')}</button>
          </div>
        </form>
      </Modal>

      {showRecurringDialog && (
        <RecurringEditDialog
          action="edit"
          onConfirm={(scope) => { setShowRecurringDialog(false); doSave(pendingData, scope) }}
          onCancel={() => setShowRecurringDialog(false)}
        />
      )}
    </>
  )
}
