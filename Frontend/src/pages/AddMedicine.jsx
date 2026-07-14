import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { C, CATEGORIES } from '../theme';
import { FInput, FSelect, Btn, Icon } from '../components/SharedUI';

const AddMedicine = ({ onAdd }) => {
  const navigate = useNavigate();
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiryDate: '',
    manufacturer: '',
    batchNumber: '',
    barcode: '',
    price: '',
    threshold: '20',
    cgst: '',
    sgst: '',
    hsnCode: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  const categories = [...CATEGORIES, 'Add new category'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = async () => {
    if (!('BarcodeDetector' in window)) {
      toast.error("Camera scanning is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        scanningRef.current = true;
        setIsCameraActive(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      toast.error("Failed to access camera");
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanFrame = async () => {
    if (!scanningRef.current || !videoRef.current || !streamRef.current) return;
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128', 'upc_a'] });
      const barcodes = await barcodeDetector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        stopCamera();
        setFormData(prev => ({ ...prev, barcode: code }));
        toast.success("Barcode scanned successfully!");
      } else if (scanningRef.current) {
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      if (scanningRef.current) requestAnimationFrame(scanFrame);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = formData.category === 'Add new category' ? newCategory.trim() : formData.category;

    if (!formData.name.trim() || !finalCategory || finalCategory === 'Select category' || formData.quantity === '' || formData.price === '' || !formData.expiryDate) {
      toast.error('Please fill in all required fields (Name, Category, Quantity, Price, Expiry)');
      return;
    }
    if (parseInt(formData.quantity, 10) < 0 || Number(formData.price) < 0) {
      toast.error('Quantity and price cannot be negative');
      return;
    }
    if (new Date(formData.expiryDate) < new Date(new Date().toDateString())) {
      toast.error('Expiry date cannot be in the past');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        category: finalCategory,
        quantity: parseInt(formData.quantity, 10),
        batchNumber: formData.batchNumber,
        manufacturer: formData.manufacturer,
        expiryDate: formData.expiryDate,
        barcode: formData.barcode,
        price: Number(formData.price),
        threshold: Number(formData.threshold) || 20,
        cgst: Number(formData.cgst) || 0,
        sgst: Number(formData.sgst) || 0,
        hsnCode: formData.hsnCode || '',
      };
      
      if (onAdd) await onAdd(payload);
      toast.success('Medicine added successfully!');
      navigate('/medicines');
    } catch (error) {
      toast.error(error.message || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, padding: isNarrow ? 0 : 24 }}>
      
      <div style={{ width: isNarrow ? '100%' : '70%', maxWidth: isNarrow ? '100%' : undefined, height: isNarrow ? '100%' : '80vh', background: C.surface, borderRadius: isNarrow ? 0 : 24, display: 'flex', flexDirection: isNarrow ? 'column' : 'row', overflow: 'hidden', boxShadow: '0 24px 50px rgba(0,0,0,0.2)', position: 'relative', animation: 'fadeUp 0.25s ease' }}>
        
        {/* Left Branding Pane */}
        <div style={{ width: isNarrow ? '100%' : '30%', display: isNarrow ? 'none' : 'flex', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: 40, flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -60, opacity: 0.05, transform: 'rotate(-15deg)' }}>
            <Icon name="pill" size={280} color="#fff" />
          </div>
          
          <div style={{ zIndex: 1 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Icon name="plus" size={24} color="#fff" />
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Expand Your<br/>Inventory</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Add new medicines efficiently. Include price and stock threshold for automatic tracking.</p>
          </div>
        </div>

        {/* Right Form Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface, position: 'relative' }}>
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
             <div>
                <h3 style={{ margin: 0, fontSize: 20, color: C.text, fontWeight: 700 }}>Medicine Details</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: C.muted }}>Fill in the required information below</p>
             </div>
             <button onClick={() => navigate('/medicines')} style={{ width: 36, height: 36, borderRadius: '50%', background: C.surfaceHover, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
               <Icon name="close" size={18} />
             </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="pill" size={14} /> Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 20 }}>
                <FInput label="Medicine Name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Paracetamol 500mg" required />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FSelect label="Category" name="category" value={formData.category} onChange={handleChange} required options={['Select category', ...categories]} />
                  {formData.category === 'Add new category' && (
                    <FInput type="text" placeholder="Enter new category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
                  )}
                </div>
                <FInput label="Manufacturer" type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="e.g. Pfizer" />
                <FInput label="Price (₹)" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" required />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px dashed ${C.border}`, margin: 0 }} />

            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="box" size={14} /> Stock & Tracking</h4>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr 1fr', gap: 20 }}>
                <FInput label="Initial Quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" min="0" required />
                <FInput label="Low Stock Threshold" type="number" name="threshold" value={formData.threshold} onChange={handleChange} placeholder="20" min="0" />
                <FInput label="Batch Number" type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} placeholder="e.g. BATCH-001" />
                <FInput label="Expiry Date" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px dashed ${C.border}`, margin: 0 }} />

            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="receipt" size={14} /> Tax Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr 1fr', gap: 20 }}>
                <FInput label="CGST (%)" type="number" name="cgst" value={formData.cgst} onChange={handleChange} min="0" max="100" step="0.01" placeholder="e.g. 6" />
                <FInput label="SGST (%)" type="number" name="sgst" value={formData.sgst} onChange={handleChange} min="0" max="100" step="0.01" placeholder="e.g. 6" />
                <FInput label="HSN Code" type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="e.g. 3004" />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px dashed ${C.border}`, margin: 0 }} />

            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 12, color: C.teal, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="barcode" size={14} /> Barcode Setup</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <FInput label="Barcode (Optional)" type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Scan or enter barcode manually" />
                </div>
                <Btn type="button" variant="secondary" onClick={startCamera} style={{ height: 42, marginBottom: 2 }}>
                  <Icon name="barcode" size={18} /> Scan barcode
                </Btn>
              </div>

              {isCameraActive && (
                <div style={{ marginTop: 16, position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", height: 260, border: `1px solid ${C.border}` }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: 100, border: '2px dashed rgba(255,255,255,0.6)', borderRadius: 12, pointerEvents: 'none' }}></div>
                  <button type="button" onClick={stopCamera} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="close" size={16} />
                  </button>
                  <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>Align barcode within the frame</div>
                </div>
              )}
            </div>
            
          </form>

          {/* Footer Actions */}
          <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#f8fafc' }}>
            <Btn type="button" variant="danger" onClick={() => navigate('/medicines')}>Cancel</Btn>
            <Btn type="submit" variant="primary" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Saving...' : 'Save Medicine'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicine;

