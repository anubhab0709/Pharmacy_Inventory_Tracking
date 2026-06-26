import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMedicine } from '../api/medicinesApi'
import Input from '../components/Input'
import Button from '../components/Button'
import { toast } from 'react-toastify'
import './Form.css'

const AddMedicine = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
    manufacturer: '',
    batchNumber: '',
  })
  const [loading, setLoading] = useState(false)

  const categories = ['Pain Relief', 'Antibiotic', 'Gastric', 'Diabetes', 'Blood Pressure', 'Allergy', 'Supplement']

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.category || !formData.quantity || !formData.expiryDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseInt(formData.quantity) < 0) {
      toast.error('Quantity cannot be negative')
      return
    }

    const expiryDate = new Date(formData.expiryDate)
    const today = new Date()
    if (expiryDate < today) {
      toast.warning('Warning: Adding an expired medicine')
    }

    try {
      setLoading(true)
      const { name, category, quantity, batchNumber, manufacturer, expiryDate } = formData
      const payload = {
        name,
        category,
        quantity: parseInt(quantity, 10),
        batchNumber,
        manufacturer,
        expiryDate
      }
      await addMedicine(payload)
      toast.success('Medicine added successfully!')
      navigate('/medicines')
    } catch (error) {
      toast.error('Failed to add medicine')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Add New Medicine</h1>
          <p className="form-subtitle">Enter the details of the new medicine</p>
        </div>

        <form onSubmit={handleSubmit} className="medicine-form">
          <Input
            label="Medicine Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter medicine name"
            required
          />

          <div className="input-group">
            <label htmlFor="category" className="input-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="select"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Input
            label="Quantity"
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            min="0"
            required
          />

          <Input
            label="Expiry Date"
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />

          <Input
            label="Manufacturer"
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            placeholder="Enter manufacturer name"
          />

          <Input
            label="Batch Number"
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
            placeholder="Enter batch number"
          />

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/medicines')}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Adding...' : 'Add Medicine'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMedicine
