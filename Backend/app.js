'use strict'

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // allow non-browser tools
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Logging
app.use(morgan('dev'))

// Body parsing
app.use(express.json())

// Health check
app.get('/health', (req, res) => res.json({ ok: true }))

// Routes
app.use('/api/medicines', require('./routes/medicineRoutes'))

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handler
app.use(errorHandler)

module.exports = app
