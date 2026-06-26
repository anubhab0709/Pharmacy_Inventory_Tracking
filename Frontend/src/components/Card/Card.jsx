import React from 'react'
import styles from './Card.module.css'

/**
 * Card Component
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card body content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.variant - Card variant: 'default' | 'compact' | 'bordered' | 'flat'
 * @param {boolean} props.hoverable - Whether card has hover effect
 * @param {Function} props.onClick - Click handler for entire card
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({ 
  title,
  children,
  footer,
  variant = 'default',
  hoverable = false,
  onClick,
  className = ''
}) => {
  const cardClasses = [
    styles.card,
    styles[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    hoverable ? styles.cardHoverable : '',
    onClick ? styles.cardClickable : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(e)
        }
      } : undefined}
    >
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
      )}
      
      <div className={styles.cardBody}>
        {children}
      </div>

      {footer && (
        <div className={styles.cardFooter}>
          {footer}
        </div>
      )}
    </div>
  )
}

/**
 * CardSection - Sub-component for organizing card content
 */
export const CardSection = ({ title, children, className = '' }) => {
  return (
    <div className={`${styles.cardSection} ${className}`}>
      {title && <h4 className={styles.sectionTitle}>{title}</h4>}
      <div className={styles.sectionContent}>{children}</div>
    </div>
  )
}

/**
 * CardGrid - Layout component for card grids
 */
export const CardGrid = ({ columns = 'auto', gap = 'normal', children, className = '' }) => {
  const gridClasses = [
    styles.cardGrid,
    styles[`cardGrid${columns.charAt(0).toUpperCase() + columns.slice(1)}`],
    styles[`cardGridGap${gap.charAt(0).toUpperCase() + gap.slice(1)}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

export default Card
