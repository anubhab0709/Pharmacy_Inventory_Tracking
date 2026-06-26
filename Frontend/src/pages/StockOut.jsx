import React, { useState } from "react";
import { C } from "../theme";
import { exportCSV, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, SearchBar, inputSt, selectSt } from "../components/SharedUI";

export default function StockOut({ medicines = [], stockOuts = [], addDispense, deleteDispense, toast, canWrite = true, isAdmin = false }) {
  const TODAY = new Date().toISOString().split("T")[0];
  const emptyForm={medicineId:"",quantity:"",patientName:"",prescribedBy:"",date:TODAY,notes:"",billNo:`BL-${String(stockOuts.length+1).padStart(3,"0")}`};
  const [form,setFormState]=useState(emptyForm);
  const [errors,setErrors]=useState({});
  const [search,setSearch]=useState("");
  const [deleteId,setDeleteId]=useState(null);
  const [focusMap,setFocusMap]=useState({});
  
  const setF=(k,v)=>{setFormState(p=>({...p,[k]:v}));if(k==="medicineId")setErrors({});};
  const selMed=medicines.find(m=>(m.id||m._id)===form.medicineId);
  const fi=(k)=>({style:inputSt(focusMap[k]),onFocus:()=>setFocusMap(p=>({...p,[k]:true})),onBlur:()=>setFocusMap(p=>({...p,[k]:false}))});

  const validate=()=>{
    const e={};
    if(!form.medicineId) e.medicineId="Select a medicine";
    if(!form.quantity||isNaN(form.quantity)||Number(form.quantity)<=0) e.quantity="Enter valid quantity";
    else if(selMed&&Number(form.quantity)>selMed.quantity) e.quantity=`Only ${selMed.quantity} units available`;
    if(!form.patientName.trim()) e.patientName="Required";
    if(!form.date) e.date="Required";
    setErrors(e);return Object.keys(e).length===0;
  };

  const handleDispense = async () => {
    if(!validate()) return;
    try {
      await addDispense({
        medicineId: form.medicineId,
        quantity: Number(form.quantity),
        patientName: form.patientName,
        prescribedBy: form.prescribedBy,
        date: form.date,
        notes: form.notes,
        billNo: form.billNo
      });
      toast(`Dispensed ${form.quantity} units of ${selMed.name}`);
      setFormState({...emptyForm, billNo:`BL-${String(stockOuts.length+2).padStart(3,"0")}`});
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if(!deleteId) return;
    try {
      await deleteDispense(deleteId);
      toast("Record deleted", "warning");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredOuts=stockOuts.filter(s=>
    (s.medicineName||"").toLowerCase().includes(search.toLowerCase())||
    (s.patientName||"").toLowerCase().includes(search.toLowerCase())||
    (s.billNo||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Dispensing" title="Stock Out" sub="Record medicine dispensing and manage transactions"/>
      <div style={{display:"grid",gridTemplateColumns:canWrite?"370px 1fr":"1fr",gap:22,alignItems:"start"}}>
        {canWrite && <Card style={{position:"sticky",top:20}}>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:17,fontWeight:700,color:C.text,margin:"0 0 2px"}}>New Dispensing</p>
          <p style={{color:C.muted,fontSize:12,marginBottom:18}}>Record medicine dispensed to a patient</p>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <Field label="Bill Number"><input value={form.billNo} onChange={e=>setF("billNo",e.target.value)} {...fi("bill")}/></Field>
            <Field label="Select Medicine" required error={errors.medicineId}>
              <select style={selectSt} value={form.medicineId} onChange={e=>setF("medicineId",e.target.value)}>
                <option value="">-- Select Medicine --</option>
                {medicines.map(m=><option key={m.id||m._id} value={m.id||m._id} style={{background:C.surface}}>{m.name} ({m.quantity} left)</option>)}
              </select>
            </Field>
            {selMed&&<div style={{background:"rgba(0,184,141,0.05)",border:`1px solid rgba(0,184,141,0.12)`,borderRadius:9,padding:"10px 14px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[{l:"Available",v:`${selMed.quantity} ${selMed.unit||"Tabs"}`,c:C.teal},{l:"Category",v:selMed.category,c:C.text},{l:"Price/Unit",v:fmtCurrency(selMed.price),c:C.text}].map(x=>(
                <div key={x.l}><p style={{color:C.dim,fontSize:10,margin:0,textTransform:"uppercase",letterSpacing:"0.07em"}}>{x.l}</p><p style={{color:x.c,fontWeight:600,margin:0,fontSize:12}}>{x.v}</p></div>
              ))}
            </div>}
            <Field label="Quantity" required error={errors.quantity}><input type="number" min="1" value={form.quantity} onChange={e=>setF("quantity",e.target.value)} placeholder="Enter quantity" {...fi("qty")}/></Field>
            {selMed&&form.quantity&&!errors.quantity&&<p style={{color:C.muted,fontSize:12,marginTop:-8}}>Total: <strong style={{color:C.teal}}>{fmtCurrency(selMed.price*Number(form.quantity))}</strong></p>}
            <Field label="Patient Name" required error={errors.patientName}><input value={form.patientName} onChange={e=>setF("patientName",e.target.value)} placeholder="Patient full name" {...fi("pt")}/></Field>
            <Field label="Prescribed By"><input value={form.prescribedBy} onChange={e=>setF("prescribedBy",e.target.value)} placeholder="Doctor's name" {...fi("dr")}/></Field>
            <Field label="Date" required error={errors.date}><input type="date" value={form.date} onChange={e=>setF("date",e.target.value)} {...fi("dt")}/></Field>
            <Field label="Notes"><textarea value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="Optional notes..." style={{...inputSt(false),resize:"vertical",minHeight:58}}/></Field>
            <Btn variant="primary" onClick={handleDispense} style={{width:"100%",justifyContent:"center"}}>Confirm Dispensing</Btn>
          </div>
        </Card>}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,color:C.text,margin:0}}>Dispensing History <span style={{color:C.muted,fontWeight:400,fontSize:14}}>({stockOuts.length})</span></p>
            <Btn variant="ghost" size="sm" icon="download" onClick={()=>exportCSV(stockOuts,"stock-out.csv")}>Export</Btn>
          </div>
          <Card style={{marginBottom:14}}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by medicine, patient, bill no..."/>
          </Card>
          <Card>
            <Table
              cols={[
                {label:"Bill #",   render:r=><span style={{color:C.teal,fontWeight:700,fontSize:12}}>{r.billNo}</span>},
                {label:"Medicine", render:r=><p style={{color:C.text,fontWeight:600,margin:0,fontSize:12}}>{r.medicineName}</p>},
                {label:"Qty",      render:r=><span style={{fontWeight:700}}>{r.quantity}</span>},
                {label:"Patient",  key:"patientName"},
                {label:"Doctor",   render:r=><span style={{color:C.muted,fontSize:12}}>{r.prescribedBy||"—"}</span>},
                {label:"Date",     render:r=><span style={{color:C.muted,fontSize:12}}>{fmtDate(r.date)}</span>},
                {label:"",         render:r=>isAdmin?<button onClick={()=>setDeleteId(r.id||r._id)} style={{background:"none",border:"none",cursor:"pointer",padding:5,display:"flex",alignItems:"center",borderRadius:6,color:C.dim,transition:"color 0.12s"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.dim}><Icon name="trash" size={14} color="currentColor"/></button>:null},
              ]}
              rows={filteredOuts}
              emptyMsg="No dispensing records found"
            />
          </Card>
        </div>
      </div>
      <ConfirmModal open={!!deleteId} title="Delete Record" message="This will remove this dispensing record. Note: stock will not be restored." onConfirm={handleDelete} onCancel={()=>setDeleteId(null)} confirmLabel="Delete Record"/>
    </div>
  );
}
