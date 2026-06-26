import React, { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

/**
 * Modal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} props.footer - Modal footer (buttons)
 * @param {string} props.size - Modal size: 'small' | 'medium' | 'large' | 'fullscreen'
 * @param {boolean} props.closeOnOverlayClick - Close when clicking overlay (default: true)
 * @param {boolean} props.closeOnEsc - Close on ESC key (default: true)
 * @param {boolean} props.showCloseButton - Show X close button (default: true)
 */
const Modal = ({ 
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement
      
      // Focus the modal
      modalRef.current?.focus()

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''

      // Restore focus to previous element
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!closeOnEsc) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEsc])

  useEffect(() => {
    if (!isOpen) return

    // Focus trap
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalClasses = [
    styles.modalContent,
    styles[`modal${size.charAt(0).toUpperCase() + size.slice(1)}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={modalClasses}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && <h2 className={styles.modalTitle}>{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={styles.modalBody}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={styles.modalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
