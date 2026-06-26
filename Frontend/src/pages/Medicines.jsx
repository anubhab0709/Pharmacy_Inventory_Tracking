import React, { useState } from "react";
import { C, CATEGORIES, UNITS } from "../theme";
import { exportCSV, getExpiryStatus, getStockStatus, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, FInput, FSelect, FTextarea, SearchBar, Badge, inputSt, selectSt } from "../components/SharedUI";

// We keep MedicineModal here as it's locally used by Medicines page
function MedicineModal({ medicine, onSave, onClose }) {
  const isEdit = !!medicine?.id || !!medicine?._id;
  const [form,setForm]=useState(medicine||{name:"",category:"Antibiotic",manufacturer:"",batchNo:"",expiryDate:"",quantity:"",threshold:"",price:"",unit:"Tablets",description:""});
  const [errors,setErrors]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const validate=()=>{
    const e={};
    if(!form.name.trim()) e.name="Required";
    if(!form.manufacturer.trim()) e.manufacturer="Required";
    if(!form.batchNo.trim()) e.batchNo="Required";
    if(!form.expiryDate) e.expiryDate="Required";
    if(!form.quantity||isNaN(form.quantity)||Number(form.quantity)<0) e.quantity="Valid number required";
    if(!form.threshold||isNaN(form.threshold)||Number(form.threshold)<0) e.threshold="Valid number required";
    if(!form.price||isNaN(form.price)||Number(form.price)<0) e.price="Valid price required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSave=()=>{
    if(validate()) {
      onSave({
        ...form,
        quantity:Number(form.quantity),
        threshold:Number(form.threshold),
        price:Number(form.price)
      });
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",overflowY:"auto",padding:20}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:22,padding:30,width:"100%",maxWidth:640,animation:"fadeUp 0.22s ease",boxShadow:"0 10px 40px rgba(0,0,0,0.1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <p style={{color:C.teal,fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600,margin:0}}>Inventory</p>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:700,color:C.text,margin:0}}>{isEdit?"Edit Medicine":"Add New Medicine"}</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:C.surfaceHover,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <Icon name="close" size={14} color={C.muted}/>
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15}}>
          <div style={{gridColumn:"1/-1"}}><FInput label="Medicine Name" required value={form.name} onChange={e=>set("name",e.target.value)} error={errors.name} placeholder="e.g. Paracetamol 500mg"/></div>
          <FSelect label="Category" required value={form.category} onChange={e=>set("category",e.target.value)} options={CATEGORIES}/>
          <FSelect label="Unit" required value={form.unit} onChange={e=>set("unit",e.target.value)} options={UNITS}/>
          <FInput label="Manufacturer" required value={form.manufacturer} onChange={e=>set("manufacturer",e.target.value)} error={errors.manufacturer} placeholder="e.g. Cipla"/>
          <FInput label="Batch Number" required value={form.batchNo} onChange={e=>set("batchNo",e.target.value)} error={errors.batchNo} placeholder="e.g. B2024001"/>
          <FInput label="Expiry Date" required type="date" value={form.expiryDate?new Date(form.expiryDate).toISOString().split('T')[0]:""} onChange={e=>set("expiryDate",e.target.value)} error={errors.expiryDate}/>
          <FInput label="Price per Unit (₹)" required type="number" min="0" step="0.01" value={form.price} onChange={e=>set("price",e.target.value)} error={errors.price} placeholder="0.00"/>
          <FInput label="Current Stock" required type="number" min="0" value={form.quantity} onChange={e=>set("quantity",e.target.value)} error={errors.quantity} placeholder="0"/>
          <FInput label="Low Stock Threshold" required type="number" min="0" value={form.threshold} onChange={e=>set("threshold",e.target.value)} error={errors.threshold} placeholder="e.g. 50"/>
          <div style={{gridColumn:"1/-1"}}><FTextarea label="Description" value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Brief description..."/></div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:22}}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{isEdit?"Save Changes":"Add Medicine"}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function Medicines({ medicines = [], addOrUpdateMedicine, deleteMed, toast, canWrite = true, isAdmin = false }) {
  const [search,setSearch]=useState("");
  const [catFilter,setCatFilter]=useState("All");
  const [editMed,setEditMed]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [deleteId,setDeleteId]=useState(null);
  const [sortBy,setSortBy]=useState("name");

  const filtered=medicines
    .filter(m=>catFilter==="All"||m.category===catFilter)
    .filter(m=>(m.name||"").toLowerCase().includes(search.toLowerCase())||(m.manufacturer||"").toLowerCase().includes(search.toLowerCase())||(m.batchNo||m.batchNumber||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==="name"?(a.name||"").localeCompare(b.name||""):sortBy==="qty"?a.quantity-b.quantity:new Date(a.expiryDate)-new Date(b.expiryDate));

  const handleSave = async (data) => {
    try {
      await addOrUpdateMedicine(data);
      toast(data._id || data.id ? "Medicine updated successfully" : "Medicine added successfully");
      setEditMed(null);
      setShowAdd(false);
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
          ...(canWrite ? [<Btn key="add" variant="primary" icon="plus" onClick={()=>setShowAdd(true)}>Add Medicine</Btn>] : []),
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
            {label:"Medicine",    render:r=><div><p style={{color:C.text,fontWeight:600,margin:0,fontSize:13}}>{r.name}</p><p style={{color:C.muted,fontSize:11,margin:0}}>{r.manufacturer} · {r.batchNo||r.batchNumber}</p></div>},
            {label:"Category",   render:r=><span style={{color:C.purple,fontSize:12,fontWeight:600}}>{r.category}</span>},
            {label:"Stock",      render:r=>{const s=getStockStatus(r.quantity,r.threshold||0);return <div><p style={{fontWeight:700,margin:"0 0 3px"}}>{r.quantity} {r.unit||"Tablets"}</p><Badge {...s}/></div>;}},
            {label:"Price",      render:r=><span style={{color:C.teal,fontWeight:600}}>{fmtCurrency(r.price)}</span>},
            {label:"Expiry",     render:r=>{const s=getExpiryStatus(r.expiryDate);return <div><p style={{color:C.text,margin:"0 0 3px",fontSize:12}}>{fmtDate(r.expiryDate)}</p><Badge {...s}/></div>;}},
            {label:"Actions",    render:r=><div style={{display:"flex",gap:6}}>
              {canWrite && <Btn variant="secondary" size="sm" icon="edit" onClick={()=>setEditMed(r)}>Edit</Btn>}
              {isAdmin && <Btn variant="danger" size="sm" icon="trash" onClick={()=>setDeleteId(r.id||r._id)}>Delete</Btn>}
              {!canWrite && !isAdmin && <span style={{color:C.dim,fontSize:12}}>View only</span>}
            </div>},
          ]}
          rows={filtered}
          emptyMsg="No medicines match your search"
        />
        <p style={{color:C.dim,fontSize:12,marginTop:10,textAlign:"right"}}>Showing {filtered.length} of {medicines.length}</p>
      </Card>
      {(showAdd||editMed)&&<MedicineModal medicine={editMed} onSave={handleSave} onClose={()=>{setShowAdd(false);setEditMed(null);}}/>}
      <ConfirmModal open={!!deleteId} title="Delete Medicine" message="This will permanently remove this medicine from your inventory. This action cannot be undone." onConfirm={handleConfirmDelete} onCancel={()=>setDeleteId(null)}/>
    </div>
  );
}
