import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { C, CATEGORIES, UNITS } from "../theme";
import { exportCSV, getExpiryStatus, getStockStatus, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, FInput, FSelect, FTextarea, SearchBar, Badge, inputSt, selectSt } from "../components/SharedUI";

import { useNavigate } from "react-router-dom";

export default function Medicines({ medicines = [], deleteMed, toast, canWrite = true, isAdmin = false }) {
  const navigate = useNavigate();
  const [search,setSearch]=useState("");
  const [catFilter,setCatFilter]=useState("All");
  const [deleteId,setDeleteId]=useState(null);
  const [viewMed, setViewMed] = useState(null);
  const [sortBy,setSortBy]=useState("name");
  const [selectedIds,setSelectedIds]=useState([]);
  const [selectAll,setSelectAll]=useState(false);

  const filtered=medicines
    .filter(m=>catFilter==="All"||m.category===catFilter)
    .filter(m=>(m.name||"").toLowerCase().includes(search.toLowerCase())||(m.manufacturer||"").toLowerCase().includes(search.toLowerCase())||(m.batchNo||m.batchNumber||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==="name"?(a.name||"").localeCompare(b.name||""):sortBy==="qty"?a.quantity-b.quantity:new Date(a.expiryDate)-new Date(b.expiryDate));

  const selectedCount = selectedIds.length;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
      return;
    }
    const ids = filtered.map((m) => m._id || m.id).filter(Boolean);
    setSelectedIds(ids);
    setSelectAll(true);
  };

  const handleBulkDelete = async () => {
    if (!selectedCount) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteMed(id)));
      toast(`${selectedCount} medicine${selectedCount === 1 ? "" : "s"} deleted`, "warning");
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      toast(err.message, "error");
    }
  };



  const handleConfirmDelete = async () => {
    if(!deleteId) return;
    try {
      await deleteMed(deleteId);
      toast("Medicine deleted", "warning");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Inventory" title="Medicines" sub={`${medicines.length} medicines in database`}
        actions={[
          selectedCount > 0 && canWrite ? <Btn key="bulk" variant="danger" icon="trash" size="sm" onClick={handleBulkDelete}>Delete {selectedCount}</Btn> : null,
          <Btn key="exp" variant="ghost" icon="download" size="sm" onClick={()=>exportCSV({
            rows: filtered.map(medicine => ({
              name: medicine.name,
              manufacturer: medicine.manufacturer,
              batchNo: medicine.batchNo || medicine.batchNumber,
              category: medicine.category,
              stock: medicine.quantity,
              unit: medicine.unit || "Tablets",
              threshold: medicine.threshold || 0,
              price: fmtCurrency(medicine.price),
              expiryDate: fmtDate(medicine.expiryDate),
              expiryStatus: getExpiryStatus(medicine.expiryDate).label,
              stockStatus: getStockStatus(medicine.quantity, medicine.threshold || 0).label,
            })),
            columns: [
              { label: "Medicine", key: "name" },
              { label: "Manufacturer", key: "manufacturer" },
              { label: "Batch No", key: "batchNo" },
              { label: "Category", key: "category" },
              { label: "Stock", key: "stock" },
              { label: "Unit", key: "unit" },
              { label: "Threshold", key: "threshold" },
              { label: "Price", key: "price" },
              { label: "Expiry Date", key: "expiryDate" },
              { label: "Expiry Status", key: "expiryStatus" },
              { label: "Stock Status", key: "stockStatus" },
            ],
            filename: "medicines.csv",
          })}>Export</Btn>,
          ...(canWrite ? [<Btn key="add" variant="primary" icon="plus" onClick={()=>navigate('/add-medicine')}>Add Medicine</Btn>] : []),
        ]}
      />
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, manufacturer, batch..."/>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...selectSt,width:"auto",minWidth:150}}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...selectSt,width:"auto",minWidth:135}}>
            <option value="name">Sort: Name</option>
            <option value="qty">Sort: Stock</option>
            <option value="expiry">Sort: Expiry</option>
          </select>
        </div>
      </Card>
      <Card>
        <Table
          cols={[
            { key: "select", label: "Select", header: <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{width:16,height:16}} />, render:r => {
              const id = r._id || r.id;
              return <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelect(id)} style={{width:16,height:16}} />;
            }},
            { key: "medicine", label:"Medicine",    render:r=><div><p style={{color:C.text,fontWeight:600,margin:0,fontSize:13}}>{r.name}</p><p style={{color:C.muted,fontSize:11,margin:0}}>{r.manufacturer} · {r.batchNo||r.batchNumber}</p></div>},
            {label:"Category",   render:r=><span style={{color:C.purple,fontSize:12,fontWeight:600}}>{r.category}</span>},
            {label:"Stock",      render:r=>{const s=getStockStatus(r.quantity,r.threshold||0);return <div><p style={{fontWeight:700,margin:"0 0 3px"}}>{r.quantity} {r.unit||"Tablets"}</p><Badge {...s}/></div>;}},
            {label:"Price",      render:r=><span style={{color:C.teal,fontWeight:600}}>{fmtCurrency(r.price)}</span>},
            {label:"Expiry",     render:r=>{const s=getExpiryStatus(r.expiryDate);return <div><p style={{color:C.text,margin:"0 0 3px",fontSize:12}}>{fmtDate(r.expiryDate)}</p><Badge {...s}/></div>;}},
            {label:"Actions",    render:r=><div style={{display:"flex",gap:6}}>
              <Btn variant="secondary" size="sm" icon="eye" onClick={()=>setViewMed(r)}>View</Btn>
              {canWrite && <Btn variant="secondary" size="sm" icon="edit" onClick={()=>navigate(`/edit-medicine/${r.id||r._id}`)}>Edit</Btn>}
              {isAdmin && <Btn variant="danger" size="sm" icon="trash" onClick={()=>setDeleteId(r.id||r._id)}>Delete</Btn>}
            </div>},
          ]}
          rows={filtered}
          emptyMsg="No medicines match your search"
        />
        <p style={{color:C.dim,fontSize:12,marginTop:10,textAlign:"right"}}>Showing {filtered.length} of {medicines.length}</p>
      </Card>

      <ConfirmModal open={!!deleteId} title="Delete Medicine" message="This will permanently remove this medicine from your inventory. This action cannot be undone." onConfirm={handleConfirmDelete} onCancel={()=>setDeleteId(null)}/>
      
      {viewMed && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1100, padding: 24, animation: 'fadeUp 0.2s ease' }}>
          <div style={{ width: 450, background: C.surface, borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Medicine Details</h3>
              </div>
              <button onClick={() => setViewMed(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: C.surfaceHover, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Name:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Category:</span>
                <strong style={{ color: C.purple, fontSize: 14 }}>{viewMed.category}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Manufacturer:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.manufacturer || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Batch Number:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.batchNumber || viewMed.batchNo || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Price:</span>
                <strong style={{ color: C.teal, fontSize: 14 }}>{fmtCurrency(viewMed.price)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Stock:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.quantity}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Threshold:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.threshold || 20}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px dashed ${C.border}` }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Expiry Date:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{fmtDate(viewMed.expiryDate)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 14 }}>Barcode:</span>
                <strong style={{ color: C.text, fontSize: 14 }}>{viewMed.barcode || 'N/A'}</strong>
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={() => setViewMed(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
