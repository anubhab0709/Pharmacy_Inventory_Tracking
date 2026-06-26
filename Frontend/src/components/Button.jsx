import React from 'react'
import './Button.css'

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, fullWidth = false }) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full-width' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
