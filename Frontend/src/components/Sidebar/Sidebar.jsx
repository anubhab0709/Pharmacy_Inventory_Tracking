import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

/**
 * Sidebar Component
 * @param {Object} props
 * @param {Array} props.menuItems - Array of menu item objects
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggle - Callback when sidebar is toggled
 * @param {string} props.variant - Sidebar variant: 'light' | 'dark'
 */
const Sidebar = ({ 
  menuItems = [],
  collapsed = false,
  onToggle,
  variant = 'light'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const defaultMenuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', end: true },
    { path: '/medicines', label: 'Medicines', icon: '💊' },
    { path: '/add-medicine', label: 'Add Medicine', icon: '➕' },
    { path: '/expiry-tracker', label: 'Expiry Tracker', icon: '📅' },
    { path: '/stock-tracker', label: 'Stock Tracker', icon: '📦' },
  ]

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems

  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className={styles.overlay}
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`
          ${styles.sidebar} 
          ${isCollapsed ? styles.sidebarCollapsed : ''} 
          ${styles[`sidebar${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}
        `}
      >
        {/* Collapse Toggle Button */}
        <button
          className={styles.collapseButton}
          onClick={handleToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className={styles.collapseIcon}>
            {isCollapsed ? '→' : '←'}
          </span>
        </button>

        {/* Navigation Menu */}
        <nav className={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!isCollapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className={styles.sidebarFooter}>
            <p className={styles.footerText}>
              © PharmaCare
            </p>
            <p className={styles.footerVersion}>v1.0.0</p>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
