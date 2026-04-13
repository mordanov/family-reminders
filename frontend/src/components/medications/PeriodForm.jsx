import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { createMedicationPeriod, getMedicationSuggestions } from '../../api/client'
import Modal from '../ui/Modal'
import styles from './PeriodForm.module.css'

function PillSelector({ value, onChange }) {
  return (
    <div className={styles.pillSelector}>
      {[1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.pillBtn} ${value === n ? styles.pillBtnActive : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function MedicationItemRow({ item, onChange, onRemove }) {
  const { t } = useTranslation()
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)

  const handleNameChange = (value) => {
    onChange({ ...item, name: value })
    clearTimeout(debounceRef.current)
    if (value.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await getMedicationSuggestions(value)
          setSuggestions(res.data)
          setShowSuggestions(res.data.length > 0)
        } catch {}
      }, 250)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemNameWrap}>
        <input
          className={styles.itemInput}
          value={item.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => item.name && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={t('medications.form.medicationName')}
        />
        {showSuggestions && (
          <div className={styles.suggestions}>
            {suggestions.map((s) => (
              <div
                key={s}
                className={styles.suggestionItem}
                onMouseDown={() => {
                  onChange({ ...item, name: s })
                  setShowSuggestions(false)
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      <PillSelector value={item.pill_count} onChange={(v) => onChange({ ...item, pill_count: v })} />
      <button type="button" className={styles.removeBtn} onClick={onRemove} title="Remove">
        ✕
      </button>
    </div>
  )
}

let _uid = 0
const uid = () => ++_uid

export default function PeriodForm({ onClose, onSaved, initialData }) {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]

  const isCopy = initialData && initialData.name

  const [form, setForm] = useState(() => ({
    name: isCopy ? `${initialData.name} копия` : '',
    start_date: initialData?.start_date ?? today,
    end_date: initialData?.end_date ?? today,
  }))
  const [intakes, setIntakes] = useState(() =>
    isCopy && initialData.intakes?.length
      ? initialData.intakes.map((intake) => ({
          id: uid(),
          name: intake.name,
          items: intake.items?.length
            ? intake.items.map((item) => ({ id: uid(), name: item.name, pill_count: item.pill_count }))
            : [{ id: uid(), name: '', pill_count: 1 }],
        }))
      : [{ id: uid(), name: '', items: [{ id: uid(), name: '', pill_count: 1 }] }]
  )
  const [error, setError] = useState('')

  const addIntake = () => {
    setIntakes((prev) => [
      ...prev,
      { id: uid(), name: '', items: [{ id: uid(), name: '', pill_count: 1 }] },
    ])
  }

  const removeIntake = (intakeId) =>
    setIntakes((prev) => prev.filter((i) => i.id !== intakeId))

  const updateIntakeName = (intakeId, name) =>
    setIntakes((prev) => prev.map((i) => (i.id === intakeId ? { ...i, name } : i)))

  const addItem = (intakeId) =>
    setIntakes((prev) =>
      prev.map((i) =>
        i.id === intakeId
          ? { ...i, items: [...i.items, { id: uid(), name: '', pill_count: 1 }] }
          : i
      )
    )

  const removeItem = (intakeId, itemId) =>
    setIntakes((prev) =>
      prev.map((i) =>
        i.id === intakeId ? { ...i, items: i.items.filter((it) => it.id !== itemId) } : i
      )
    )

  const updateItem = (intakeId, itemId, updates) =>
    setIntakes((prev) =>
      prev.map((i) =>
        i.id === intakeId
          ? { ...i, items: i.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)) }
          : i
      )
    )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.end_date < form.start_date) {
      setError(t('medications.form.dateError'))
      return
    }

    const payload = {
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      intakes: intakes
        .filter((i) => i.name.trim())
        .map((intake, idx) => ({
          name: intake.name.trim(),
          order_index: idx,
          items: intake.items
            .filter((it) => it.name.trim())
            .map((it) => ({ name: it.name.trim(), pill_count: it.pill_count })),
        })),
    }

    try {
      await createMedicationPeriod(payload)
      toast.success(t('medications.created'))
      onSaved()
    } catch {
      toast.error(t('medications.saveError'))
    }
  }

  return (
    <Modal title={t('medications.form.title')} onClose={onClose} width={600}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>{t('medications.form.name')}</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('medications.form.namePlaceholder')}
            required
          />
        </div>

        <div className={styles.dateRow}>
          <div className={styles.field}>
            <label className={styles.label}>{t('medications.form.startDate')}</label>
            <input
              type="date"
              className={styles.input}
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('medications.form.endDate')}</label>
            <input
              type="date"
              className={styles.input}
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              required
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{t('medications.form.intakes')}</span>
            <button type="button" className={styles.addBtn} onClick={addIntake}>
              {t('medications.form.addIntake')}
            </button>
          </div>

          {intakes.map((intake) => (
            <div key={intake.id} className={styles.intakeBlock}>
              <div className={styles.intakeHeader}>
                <input
                  className={styles.input}
                  value={intake.name}
                  onChange={(e) => updateIntakeName(intake.id, e.target.value)}
                  placeholder={t('medications.form.intakeNamePlaceholder')}
                />
                {intakes.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeIntakeBtn}
                    onClick={() => removeIntake(intake.id)}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.itemsSection}>
                {intake.items.map((item) => (
                  <MedicationItemRow
                    key={item.id}
                    item={item}
                    onChange={(updates) => updateItem(intake.id, item.id, updates)}
                    onRemove={() => removeItem(intake.id, item.id)}
                  />
                ))}
                <button
                  type="button"
                  className={styles.addItemBtn}
                  onClick={() => addItem(intake.id)}
                >
                  {t('medications.form.addMedication')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {t('forms.cancel')}
          </button>
          <button type="submit" className={styles.submitBtn}>
            {t('medications.form.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
