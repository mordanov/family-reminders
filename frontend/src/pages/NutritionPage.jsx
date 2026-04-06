import { useState, useEffect, useCallback, useRef } from 'react'
import { addDays, format, isToday } from 'date-fns'
import { ru as ruLocale, enUS } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  getMealPlan, upsertMealPlan,
  getShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem,
  newShoppingListVersion,
} from '../api/client'
import styles from './NutritionPage.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const EMPTY_MEAL = { adults_text: '', children_text: '' }

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export default function NutritionPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ru' ? ruLocale : enUS

  // ── Meal plan state ────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealData, setMealData] = useState({
    breakfast: { ...EMPTY_MEAL },
    lunch: { ...EMPTY_MEAL },
    dinner: { ...EMPTY_MEAL },
  })
  // Track last saved values per cell to detect actual changes on blur
  const savedRef = useRef({ ...mealData })
  // Track which cells currently have saved flash
  const [savedCells, setSavedCells] = useState({})

  const loadMealPlan = useCallback(async (date) => {
    try {
      const r = await getMealPlan(toDateStr(date))
      const data = {
        breakfast: { ...EMPTY_MEAL },
        lunch: { ...EMPTY_MEAL },
        dinner: { ...EMPTY_MEAL },
      }
      for (const row of r.data) {
        if (data[row.meal_type]) {
          data[row.meal_type] = { adults_text: row.adults_text, children_text: row.children_text }
        }
      }
      setMealData(data)
      savedRef.current = JSON.parse(JSON.stringify(data))
    } catch {
      toast.error(t('nutrition.loadError'))
    }
  }, [t])

  useEffect(() => { loadMealPlan(currentDate) }, [currentDate, loadMealPlan])

  const handleDateChange = (delta) => {
    setCurrentDate((d) => addDays(d, delta))
  }

  const handleCellChange = (meal, col, value) => {
    setMealData((prev) => ({
      ...prev,
      [meal]: { ...prev[meal], [col]: value },
    }))
  }

  const handleCellBlur = async (meal, col) => {
    const current = mealData[meal][col]
    const saved = savedRef.current[meal]?.[col] ?? ''
    if (current === saved) return
    try {
      const payload = {
        date: toDateStr(currentDate),
        meal_type: meal,
        adults_text: mealData[meal].adults_text,
        children_text: mealData[meal].children_text,
      }
      // apply the in-progress value for the changed col
      payload[col] = current
      await upsertMealPlan(payload)
      savedRef.current = {
        ...savedRef.current,
        [meal]: { ...savedRef.current[meal], [col]: current },
      }
      const key = `${meal}-${col}`
      setSavedCells((s) => ({ ...s, [key]: true }))
      setTimeout(() => setSavedCells((s) => { const n = { ...s }; delete n[key]; return n }), 800)
    } catch {
      toast.error(t('nutrition.saveError'))
    }
  }

  // ── Shopping list state ────────────────────────────────────────────────
  const [shoppingList, setShoppingList] = useState({ version_id: null, items: [] })
  const [newItemText, setNewItemText] = useState('')

  const loadShoppingList = useCallback(async () => {
    try {
      const r = await getShoppingList()
      setShoppingList(r.data)
    } catch {
      toast.error(t('nutrition.loadError'))
    }
  }, [t])

  useEffect(() => { loadShoppingList() }, [loadShoppingList])

  const handleAddItem = async () => {
    const text = newItemText.trim()
    if (!text) return
    try {
      const r = await addShoppingItem({ text })
      setShoppingList((prev) => ({ ...prev, items: [...prev.items, r.data] }))
      setNewItemText('')
    } catch {
      toast.error(t('nutrition.saveError'))
    }
  }

  const handleToggleItem = async (item) => {
    try {
      const r = await updateShoppingItem(item.id, { checked: !item.checked })
      setShoppingList((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === item.id ? r.data : i)),
      }))
    } catch {
      toast.error(t('nutrition.saveError'))
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      await deleteShoppingItem(id)
      setShoppingList((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }))
    } catch {
      toast.error(t('nutrition.saveError'))
    }
  }

  const handleNewVersion = async () => {
    try {
      const r = await newShoppingListVersion()
      setShoppingList(r.data)
      toast.success(t('nutrition.newVersionCreated'))
    } catch {
      toast.error(t('nutrition.saveError'))
    }
  }

  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  const dateLabelFull = currentDate.toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })
  const dateHeaderStr = new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.date}>{dateHeaderStr}</div>
        <div className={styles.title}>{t('nutrition.title')}</div>
      </div>

      {/* ── Meal plan ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('nutrition.mealPlan')}</h2>
          <div className={styles.dateNav}>
            <button className={styles.navBtn} onClick={() => handleDateChange(-1)}>‹</button>
            <span className={styles.dateLabel}>{dateLabelFull}</span>
            <button className={styles.navBtn} onClick={() => handleDateChange(1)}>›</button>
            {!isToday(currentDate) && (
              <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>
                {t('nutrition.today')}
              </button>
            )}
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('nutrition.meal')}</th>
              <th>{t('nutrition.adults')}</th>
              <th>{t('nutrition.children')}</th>
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((meal) => (
              <tr key={meal}>
                <td><div className={styles.mealLabel}>{t(`nutrition.${meal}`)}</div></td>
                {['adults_text', 'children_text'].map((col) => (
                  <td key={col}>
                    <textarea
                      className={`${styles.cellTextarea} ${savedCells[`${meal}-${col}`] ? styles.saved : ''}`}
                      value={mealData[meal][col]}
                      onChange={(e) => handleCellChange(meal, col, e.target.value)}
                      onBlur={() => handleCellBlur(meal, col)}
                      rows={2}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Shopping list ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('nutrition.shoppingList')}</h2>
          <div className={styles.shoppingActions}>
            <button
              className={styles.newListBtn}
              onClick={handleNewVersion}
              disabled={shoppingList.items.length === 0}
            >{t('nutrition.clearList')}</button>
          </div>
        </div>

        {shoppingList.items.length === 0 ? (
          <p className={styles.emptyList}>—</p>
        ) : (
          <ul className={styles.itemList}>
            {shoppingList.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <input
                  type="checkbox"
                  className={styles.itemCheckbox}
                  checked={item.checked}
                  onChange={() => handleToggleItem(item)}
                />
                <span className={styles.itemText}>{item.text}</span>
                <button className={styles.deleteBtn} onClick={() => handleDeleteItem(item.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.addRow}>
          <input
            type="text"
            className={styles.addInput}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder={t('nutrition.addItemPlaceholder')}
          />
          <button className={styles.addBtn} onClick={handleAddItem}>{t('nutrition.addItem')}</button>
        </div>
      </section>
    </div>
  )
}
