import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { createIncident, updateIncident } from '../../api/client'
import Modal from '../ui/Modal'
import styles from './IncidentForm.module.css'

const toLocalInputValue = (isoValue) => {
  if (!isoValue) return ''
  const date = new Date(isoValue)
  const tzOffsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

const localInputToIso = (localValue) => new Date(localValue).toISOString()

export default function IncidentForm({ incident, onClose, onSaved }) {
  const isEdit = !!incident
  const { t } = useTranslation()
  const now = new Date()
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)

  const [form, setForm] = useState({
    start_datetime: incident ? toLocalInputValue(incident.start_datetime) : toLocalInputValue(now.toISOString()),
    end_datetime: incident ? toLocalInputValue(incident.end_datetime) : toLocalInputValue(inOneHour.toISOString()),
    description: incident?.description ?? '',
    actions_taken: incident?.actions_taken ?? '',
    importance: incident?.importance ?? 3,
  })

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.start_datetime || !form.end_datetime) return

    const payload = {
      start_datetime: localInputToIso(form.start_datetime),
      end_datetime: localInputToIso(form.end_datetime),
      description: form.description.trim(),
      actions_taken: form.actions_taken.trim(),
      importance: Number(form.importance),
    }

    try {
      if (isEdit) {
        await updateIncident(incident.id, payload)
        toast.success(t('incidents.updated'))
      } else {
        await createIncident(payload)
        toast.success(t('incidents.created'))
      }
      onSaved()
    } catch {
      toast.error(t('incidents.saveError'))
    }
  }

  return (
    <Modal onClose={onClose} title={isEdit ? t('incidents.editTitle') : t('incidents.newTitle')} width={620}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t('incidents.start')}</label>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.start_datetime}
              onChange={(e) => set('start_datetime', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('incidents.end')}</label>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.end_datetime}
              onChange={(e) => set('end_datetime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('incidents.description')}</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={t('incidents.descriptionPlaceholder')}
            rows={3}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('incidents.actionsTaken')}</label>
          <textarea
            className={styles.textarea}
            value={form.actions_taken}
            onChange={(e) => set('actions_taken', e.target.value)}
            placeholder={t('incidents.actionsTakenPlaceholder')}
            rows={3}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('incidents.importance')}</label>
          <div className={styles.stars} role="radiogroup" aria-label={t('incidents.importance')}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.starBtn} ${Number(form.importance) >= value ? styles.active : ''}`}
                onClick={() => set('importance', value)}
                aria-label={`${t('incidents.importance')} ${value}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>{t('forms.cancel')}</button>
          <button type="submit" className={styles.saveBtn}>{isEdit ? t('forms.saveChanges') : t('incidents.create')}</button>
        </div>
      </form>
    </Modal>
  )
}

