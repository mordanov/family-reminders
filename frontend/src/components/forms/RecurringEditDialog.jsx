import styles from './RecurringEditDialog.module.css'

export default function RecurringEditDialog({ action, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3 className={styles.title}>{action === 'delete' ? 'Delete Recurring Task' : 'Edit Recurring Task'}</h3>
        <p className={styles.body}>This is a recurring task. What would you like to {action}?</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.scopeBtn} onClick={() => onConfirm('this')}>
            This occurrence only
          </button>
          <button className={`${styles.scopeBtn} ${styles.future}`} onClick={() => onConfirm('future')}>
            This & future occurrences
          </button>
        </div>
      </div>
    </div>
  )
}
