import { useTranslation } from 'react-i18next'
import styles from './RecurringEditDialog.module.css'

export default function RecurringEditDialog({ action, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const actionText = action === 'delete' ? t('forms.recurring.delete') : t('forms.recurring.edit')

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3 className={styles.title}>
          {action === 'delete' ? t('forms.recurring.deleteTitle') : t('forms.recurring.editTitle')}
        </h3>
        <p className={styles.body}>{t('forms.recurring.body', { action: actionText })}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>{t('forms.cancel')}</button>
          <button className={styles.scopeBtn} onClick={() => onConfirm('this')}>
            {t('forms.recurring.thisOnly')}
          </button>
          <button className={`${styles.scopeBtn} ${styles.future}`} onClick={() => onConfirm('future')}>
            {t('forms.recurring.thisFuture')}
          </button>
        </div>
      </div>
    </div>
  )
}
