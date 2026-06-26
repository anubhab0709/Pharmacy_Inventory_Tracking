import React from 'react'
import './Card.css'
import MedicationIcon from '@mui/icons-material/MedicationOutlined'
import InventoryIcon from '@mui/icons-material/Inventory2Outlined'
import WarningIcon from '@mui/icons-material/WarningAmberRounded'
import EventBusyIcon from '@mui/icons-material/EventBusyRounded'

const iconMap = {
  medicine: <MedicationIcon fontSize="medium" />,
  stock: <InventoryIcon fontSize="medium" />,
  warning: <WarningIcon fontSize="medium" />,
  expiry: <EventBusyIcon fontSize="medium" />,
}

const Card = ({ title, value, icon, color, subtitle, onClick }) => {
  // icon prop can be a string key or a React element
  const resolvedIcon = typeof icon === 'string' && iconMap[icon] ? iconMap[icon] : icon
  return (
    <div 
      className={`card ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      style={{ borderTopColor: color }}
    >
      <div className="card-icon" style={{ background: `${color}20`, color }}>
        {resolvedIcon}
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-value">{value}</p>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}

export default Card
