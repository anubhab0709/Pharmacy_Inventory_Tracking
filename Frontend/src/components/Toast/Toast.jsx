import React, { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Toast Component
 * @param {Object} props
 * @param {string} props.message - Toast message
 * @param {string} props.type - Toast type: 'success' | 'error' | 'info' | 'warning'
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 3000)
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.isVisible - Whether toast is visible
 * @param {string} props.position - Toast position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
 */
const Toast = ({ 
  message,
  type = 'info',
  duration = 3000,
  onClose,
  isVisible = true,
  position = 'top-right'
}) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (!isVisible || duration === 0) return

    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [isVisible, duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose?.()
    }, 300) // Match animation duration
  }

  if (!isVisible) return null

  const toastClasses = [
    styles.toast,
    styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`],
    styles[`toastPosition${position.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`],
    isExiting ? styles.toastExit : styles.toastEnter
  ].filter(Boolean).join(' ')

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ⓘ'
  }

  return (
    <div className={toastClasses} role="alert" aria-live="polite">
      <div className={styles.toastIcon}>
        {icons[type]}
      </div>
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button
        type="button"
        className={styles.toastClose}
        onClick={handleClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * ToastContainer Component - Manages multiple toasts
 * @param {Object} props
 * @param {Array} props.toasts - Array of toast objects: [{ id, message, type, duration }]
 * @param {Function} props.onRemove - Remove toast handler
 * @param {string} props.position - Container position
 */
export const ToastContainer = ({ 
  toasts = [], 
  onRemove,
  position = 'top-right'
}) => {
  const containerClasses = [
    styles.toastContainer,
    styles[`containerPosition${position.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`]
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
          isVisible={true}
          position={position}
        />
      ))}
    </div>
  )
}

/**
 * useToast Hook - Manages toast state
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = ({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type, duration }])
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message, duration) => 
    addToast({ message, type: 'success', duration })

  const showError = (message, duration) => 
    addToast({ message, type: 'error', duration })

  const showInfo = (message, duration) => 
    addToast({ message, type: 'info', duration })

  const showWarning = (message, duration) => 
    addToast({ message, type: 'warning', duration })

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
}

export default Toast
