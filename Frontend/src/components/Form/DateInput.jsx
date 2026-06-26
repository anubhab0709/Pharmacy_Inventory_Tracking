import React, { forwardRef } from 'react'
import styles from './DateInput.module.css'

/**
 * DateInput Component
 * @param {Object} props
 * @param {string} props.label - Date input label
 * @param {string} props.name - Date input name
 * @param {string} props.value - Date value (YYYY-MM-DD)
 * @param {Function} props.onChange - Change handler
 * @param {string} props.min - Minimum date (YYYY-MM-DD)
 * @param {string} props.max - Maximum date (YYYY-MM-DD)
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text below input
 * @param {string} props.variant - Input variant: 'default' | 'filled'
 * @param {string} props.size - Input size: 'small' | 'medium' | 'large'
 */
const DateInput = forwardRef(({ 
  label,
  name,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  error,
  helpText,
  variant = 'default',
  size = 'medium',
  className = '',
  ...rest
}, ref) => {
  const inputClasses = [
    styles.dateInput,
    styles[`dateInput${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`dateInput${size.charAt(0).toUpperCase() + size.slice(1)}`],
    error ? styles.dateInputError : '',
    disabled ? styles.dateInputDisabled : '',
    className
  ].filter(Boolean).join(' ')

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={styles.dateInputWrapper}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputContainer}>
        <span className={styles.icon}>📅</span>
        <input
          ref={ref}
          type="date"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...rest}
        />
      </div>

      {error && (
        <p id={`${name}-error`} className={styles.errorMessage}>
          {error}
        </p>
      )}

      {helpText && !error && (
        <p id={`${name}-help`} className={styles.helpText}>
          {helpText}
        </p>
      )}
    </div>
  )
})

DateInput.displayName = 'DateInput'

export default DateInput
