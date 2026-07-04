import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMedicineById } from '../api/medicinesApi';
import { toast } from 'react-toastify';
import { C, CATEGORIES } from '../theme';
import { FInput, FSelect, Btn, Icon } from '../components/SharedUI';

const EditMedicine = ({ onUpdate }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
    manufacturer: '',
    batchNumber: '',
    barcode: '',
    price: '',
    threshold: '20'
  });
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = [...CATEGORIES, 'Add new category'];

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const response = await getMedicineById(id);
      const medicine = response.data || response;
      const fmtExp = medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '';
      setFormData({
        name: medicine.name || '',
        category: medicine.category || '',
        quantity: medicine.quantity ?? '',
        expiryDate: fmtExp,
        manufacturer: medicine.manufacturer || '',
        batchNumber: medicine.batchNumber || medicine.batchNo || '',
        barcode: medicine.barcode || '',
        price: medicine.price ?? '',
        threshold: medicine.threshold ?? 20
      });
    } catch (error) {
      toast.error('Failed to fetch medicine details');
      navigate('/medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = formData.category === 'Add new category' ? newCategory : formData.category;

    if (!formData.name || !finalCategory || formData.quantity === '' || formData.price === '' || !formData.expiryDate) {
      toast.error('Please fill in all required fields (Name, Category, Quantity, Price, Expiry)');
      return;
    }

    if (parseInt(formData.quantity, 10) < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        category: finalCategory,
        quantity: parseInt(formData.quantity, 10),
        batchNumber: formData.batchNumber,
        manufacturer: formData.manufacturer,
        expiryDate: formData.expiryDate,
        barcode: formData.barcode,
        price: Number(formData.price),
        threshold: Number(formData.threshold) || 0
      };
      
      if (onUpdate) {
        await onUpdate({ id, ...payload, _id: id });
      }
      toast.success('Medicine updated successfully!');
      navigate('/medicines');
    } catch (error) {
      toast.error('Failed to update medicine');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000 }}>
        <div style={{ background: C.surface, padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: 16, color: C.text, fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, padding: 24 }}>
      <div style={{ width: '70%', height: '80vh', background: C.surface, borderRadius: 24, display: 'flex', overflow: 'hidden', boxShadow: '0 24px 50px rgba(0,0,0,0.2)', position: 'relative', animation: 'fadeUp 0.25s ease' }}>
        
        {/* Left Branding Pane */}
        <div style={{ width: '30%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: 40, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -60, opacity: 0.05, transform: 'rotate(-15deg)' }}>
            <Icon name="edit" size={280} color="#fff" />
          </div>
          <div style={{ zIndex: 1 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Icon name="edit" size={24} color="#fff" />
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Update<br/>Medicine</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Keep your inventory accurate. Update quantities, pricing, and expiry dates as needed.</p>
          </div>
        </div>

        {/* Right Form Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface, position: 'relative' }}>
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
             <div>
                <h3 style={{ margin: 0, fontSize: 20, color: C.text, fontWeight: 700 }}>Edit Details</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: C.muted }}>Update the information for {formData.name}</p>
             </div>
             <button onClick={() => navigate('/medicines')} style={{ width: 36, height: 36, borderRadius: '50%', background: C.surfaceHover, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
               <Icon name="close" size={18} />
             </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="pill" size={14} /> Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <FInput label="Medicine Name" type="text" name="name" value={formData.name} onChange={handleChange} required />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FSelect label="Category" name="category" value={formData.category} onChange={handleChange} required options={['Select category', ...categories]} />
                  {formData.category === 'Add new category' && (
                    <FInput type="text" placeholder="Enter new category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
                  )}
                </div>
                <FInput label="Manufacturer" type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
                <FInput label="Price (₹)" type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px dashed ${C.border}`, margin: 0 }} />

            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="box" size={14} /> Stock & Tracking</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <FInput label="Quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required />
                <FInput label="Low Stock Threshold" type="number" name="threshold" value={formData.threshold} onChange={handleChange} min="0" />
                <FInput label="Batch Number" type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} />
                <FInput label="Expiry Date" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px dashed ${C.border}`, margin: 0 }} />

            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="barcode" size={14} /> Barcode Setup</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <FInput label="Barcode" type="text" name="barcode" value={formData.barcode} onChange={handleChange} />
                </div>
              </div>
            </div>
          </form>

          <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#f8fafc' }}>
            <Btn type="button" variant="ghost" onClick={() => navigate('/medicines')}>Cancel</Btn>
            <Btn type="submit" variant="primary" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Updating...' : 'Update Medicine'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMedicine;
