import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMedicineById, updateMedicine } from '../api/medicinesApi'
import Input from '../components/Input'
import Button from '../components/Button'
import { toast } from 'react-toastify'
import './Form.css'

const EditMedicine = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
    manufacturer: '',
    batchNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const categories = ['Pain Relief', 'Antibiotic', 'Gastric', 'Diabetes', 'Blood Pressure', 'Allergy', 'Supplement']

  useEffect(() => {
    fetchMedicine()
  }, [id])

  const fetchMedicine = async () => {
    try {
      setLoading(true)
      const response = await getMedicineById(id)
      const medicine = response.data
      setFormData({
        name: medicine.name,
        category: medicine.category,
        quantity: medicine.quantity,
        expiryDate: medicine.expiryDate,
        manufacturer: medicine.manufacturer || '',
        batchNumber: medicine.batchNumber || '',
      })
    } catch (error) {
      toast.error('Failed to fetch medicine details')
      navigate('/medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.expiryDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseInt(formData.quantity) < 0) {
      toast.error('Quantity cannot be negative')
      return
    }

    try {
      setSubmitting(true)
      const { name, category, quantity, batchNumber, manufacturer, expiryDate } = formData
      const payload = {
        name,
        category,
        quantity: parseInt(quantity, 10),
        batchNumber,
        manufacturer,
        expiryDate
      }
      await updateMedicine(id, payload)
      toast.success('Medicine updated successfully!')
      navigate('/medicines')
    } catch (error) {
      toast.error('Failed to update medicine')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading medicine details...</p>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Edit Medicine</h1>
          <p className="form-subtitle">Update the medicine details</p>
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
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Medicine'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMedicine
