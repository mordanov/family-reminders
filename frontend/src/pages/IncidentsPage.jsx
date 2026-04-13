import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { getIncidents } from '../api/client'
import IncidentsBlock from '../components/tasks/IncidentsBlock'
import styles from './IncidentsPage.module.css'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  const refresh = async () => {
    try {
      const res = await getIncidents()
      setIncidents(res.data)
    } catch {
      toast.error(t('tasks.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>

  return (
    <div className={styles.root}>
      <IncidentsBlock incidents={incidents} onRefresh={refresh} />
    </div>
  )
}
