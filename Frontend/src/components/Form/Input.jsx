import React, { forwardRef } from 'react'
import styles from './Input.module.css'

/**
 * Input Component
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, number, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text below input
 * @param {string} props.variant - Input variant: 'default' | 'filled'
 * @param {string} props.size - Input size: 'small' | 'medium' | 'large'
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 */
const Input = forwardRef(({ 
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  className = '',
  ...rest
}, ref) => {
  const inputClasses = [
    styles.input,
    styles[`input${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`input${size.charAt(0).toUpperCase() + size.slice(1)}`],
    error ? styles.inputError : '',
    disabled ? styles.inputDisabled : '',
    leftIcon ? styles.inputWithLeftIcon : '',
    rightIcon ? styles.inputWithRightIcon : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputContainer}>
        {leftIcon && (
          <span className={styles.leftIcon}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...rest}
        />

        {rightIcon && (
          <span className={styles.rightIcon}>
            {rightIcon}
          </span>
        )}
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

Input.displayName = 'Input'

export default Input
