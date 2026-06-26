import React, { forwardRef } from 'react'
import styles from './Select.module.css'

/**
 * Select Component
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {string} props.name - Select name
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Array of options: [{ value, label }]
 * @param {string} props.placeholder - Placeholder option
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text below select
 * @param {string} props.variant - Select variant: 'default' | 'filled'
 * @param {string} props.size - Select size: 'small' | 'medium' | 'large'
 */
const Select = forwardRef(({ 
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  helpText,
  variant = 'default',
  size = 'medium',
  className = '',
  ...rest
}, ref) => {
  const selectClasses = [
    styles.select,
    styles[`select${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`select${size.charAt(0).toUpperCase() + size.slice(1)}`],
    error ? styles.selectError : '',
    disabled ? styles.selectDisabled : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.selectWrapper}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.selectContainer}>
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>▼</span>
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

Select.displayName = 'Select'

export default Select
