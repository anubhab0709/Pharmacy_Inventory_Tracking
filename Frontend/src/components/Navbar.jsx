import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'
import SearchIcon from '@mui/icons-material/SearchRounded'
import NotificationsIcon from '@mui/icons-material/NotificationsNoneRounded'

const Navbar = () => {
  const [shopName, setShopName] = useState(localStorage.getItem('shopName') || 'Jagadhatri Medical Hall')

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="mobile-toggle">☰</button>
        <div className="navbar-search">
          <SearchIcon className="search-icon" fontSize="small" />
          <input type="text" placeholder="Quick search..." />
        </div>
      </div>
      
      <div className="navbar-right">
        <button className="navbar-action-btn">
          <NotificationsIcon />
          <span className="notification-badge"></span>
        </button>
        <div className="user-profile">
          <div className="avatar">JM</div>
          <div className="user-info">
            <span className="user-name">{shopName}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
