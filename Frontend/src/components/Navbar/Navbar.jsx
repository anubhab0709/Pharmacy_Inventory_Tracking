import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

/**
 * Navbar Component
 * @param {Object} props
 * @param {string} props.brandName - Brand/app name to display
 * @param {Function} props.onLanguageChange - Callback when language changes
 * @param {string} props.currentLanguage - Current selected language (EN/BN/HIN)
 * @param {Object} props.user - User object with name and avatar
 */
const Navbar = ({ 
  brandName = 'PharmaCare Tracker',
  onLanguageChange,
  currentLanguage = 'EN',
  user = { name: 'Admin User', avatar: null }
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'BN', label: 'বাংলা' },
    { code: 'HIN', label: 'हिंदी' }
  ]

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode)
    if (onLanguageChange) {
      onLanguageChange(langCode)
    }
  }

  const toggleProfileDropdown = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        {/* Logo/Brand */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>💊</span>
          <span className={styles.brandText}>{brandName}</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className={styles.mobileToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        {/* Navbar Actions */}
        <div className={`${styles.navbarActions} ${isMobileMenuOpen ? styles.navbarActionsOpen : ''}`}>
          {/* Language Toggle */}
          <div className={styles.languageSelector}>
            <label htmlFor="language-select" className={styles.languageLabel}>
              🌐
            </label>
            <select
              id="language-select"
              className={styles.languageSelect}
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current Date Display */}
          <div className={styles.dateDisplay}>
            <span className={styles.dateIcon}>📅</span>
            <span className={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className={styles.profileDropdown}>
            <button
              className={styles.profileButton}
              onClick={toggleProfileDropdown}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.profileAvatar} />
              ) : (
                <span className={styles.profileAvatarPlaceholder}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className={styles.profileName}>{user.name}</span>
              <span className={styles.profileArrow}>▼</span>
            </button>

            {isProfileOpen && (
              <div className={styles.profileMenu}>
                <Link to="/profile" className={styles.profileMenuItem}>
                  👤 My Profile
                </Link>
                <Link to="/settings" className={styles.profileMenuItem}>
                  ⚙️ Settings
                </Link>
                <hr className={styles.profileMenuDivider} />
                <button className={styles.profileMenuItem}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
