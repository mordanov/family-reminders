import { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { deleteIncident } from '../../api/client'
import IncidentForm from '../forms/IncidentForm'
import styles from './IncidentsBlock.module.css'

const renderStars = (value) => '★'.repeat(value) + '☆'.repeat(5 - value)

export default function IncidentsBlock({ incidents, onRefresh }) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editIncident, setEditIncident] = useState(null)

  const handleDelete = async (id) => {
    try {
      await deleteIncident(id)
      toast.success(t('incidents.deleted'))
      onRefresh()
    } catch {
      toast.error(t('incidents.deleteError'))
    }
  }

  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>{t('incidents.title')}</h2>
        <button className={styles.addBtn} onClick={() => { setEditIncident(null); setShowForm(true) }}>
          {t('incidents.add')}
        </button>
      </div>

      {incidents.length === 0 ? (
        <p className={styles.empty}>{t('incidents.empty')}</p>
      ) : (
        <div className={styles.list}>
          {incidents.map((incident) => (
            <div key={incident.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.dateRange}>
                  {format(new Date(incident.start_datetime), 'dd.MM.yyyy HH:mm')} - {format(new Date(incident.end_datetime), 'dd.MM.yyyy HH:mm')}
                </span>
                <span className={styles.importance} title={t('incidents.importance')}>
                  {renderStars(Number(incident.importance || 3))}
                </span>
              </div>

              <p className={styles.description}>{incident.description}</p>
              <p className={styles.actionsTaken}><strong>{t('incidents.actionsTaken')}:</strong> {incident.actions_taken}</p>

              <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => { setEditIncident(incident); setShowForm(true) }}>
                  ✎
                </button>
                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(incident.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <IncidentForm
          incident={editIncident}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}
    </section>
  )
}

