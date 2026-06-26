'use strict'

const mongoose = require('mongoose')

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: '' },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date, default: null },
  price: { type: Number, default: null, min: 0 }
}, {
  timestamps: true
})

// Virtual id to mirror _id as string
MedicineSchema.virtual('id').get(function () {
  return this._id.toHexString()
})
MedicineSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
  }
})

module.exports = mongoose.model('Medicine', MedicineSchema)
