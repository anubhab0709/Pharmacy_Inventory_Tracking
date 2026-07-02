import React, { useMemo, useState } from "react";
import { C } from "../theme";
import { exportCSV, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, SearchBar, inputSt, selectSt } from "../components/SharedUI";

export default function StockOut({ medicines = [], stockOuts = [], profile = {}, addDispense, deleteDispense, toast, canWrite = true, isAdmin = false }) {
  const emptyForm = { medicineId: "", quantity: "" };
  const [form, setFormState] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [focusMap, setFocusMap] = useState({});

  const setF = (k, v) => { setFormState((p) => ({ ...p, [k]: v })); if (k === "medicineId") setErrors((prev) => ({ ...prev, medicineId: "" })); };
  const selMed = medicines.find((m) => (m.id || m._id) === form.medicineId);
  const fi = (k) => ({ style: inputSt(focusMap[k]), onFocus: () => setFocusMap((p) => ({ ...p, [k]: true })), onBlur: () => setFocusMap((p) => ({ ...p, [k]: false })) });

  const quickTotal = useMemo(() => {
    const quantity = Number(form.quantity || 0);
    const price = Number(selMed?.price || 0);
    return quantity > 0 ? quantity * price : 0;
  }, [form.quantity, selMed]);

  const validate = () => {
    const nextErrors = {};
    if (!form.medicineId) nextErrors.medicineId = "Select a medicine";
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) nextErrors.quantity = "Enter valid quantity";
    else if (selMed && Number(form.quantity) > selMed.quantity) nextErrors.quantity = `Only ${selMed.quantity} units available`;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleQuickStockOut = async () => {
    if (!validate()) return;
    try {
      await addDispense({
        medicineId: form.medicineId,
        quantity: Number(form.quantity),
        transactionType: "fast",
      });
      toast(`Deducted ${form.quantity} units of ${selMed.name}`);
      setFormState(emptyForm);
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

  const filteredOuts = stockOuts.filter((s) =>
    (s.medicineName||"").toLowerCase().includes(search.toLowerCase())||
    (s.patientName||"").toLowerCase().includes(search.toLowerCase())||
    (s.billNo||"").toLowerCase().includes(search.toLowerCase())||
    (s.transactionType||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Dispensing" title="Stock Out" sub="Quick stock deduction without invoice generation"/>
      <div style={{display:"grid",gridTemplateColumns:canWrite?"360px 1fr":"1fr",gap:22,alignItems:"start"}}>
        {canWrite && <Card style={{position:"sticky",top:20}}>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Fast Stock Out</p>
          <p style={{color:C.muted,fontSize:14,marginBottom:18,lineHeight:1.5}}>Deduct stock quickly. No invoice is generated from this screen.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="Select Medicine" required error={errors.medicineId}>
              <select style={selectSt} value={form.medicineId} onChange={e=>setF("medicineId",e.target.value)}>
                <option value="">-- Select Medicine --</option>
                {medicines.map(m=><option key={m.id||m._id} value={m.id||m._id} style={{background:C.surface}}>{m.name} ({m.quantity} left)</option>)}
              </select>
            </Field>
            {selMed&&<div style={{background:"rgba(0,184,141,0.05)",border:`1px solid rgba(0,184,141,0.12)`,borderRadius:14,padding:"12px 14px",display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
              {[{l:"Available",v:`${selMed.quantity} ${selMed.unit||"Tabs"}`,c:C.teal},{l:"Unit Price",v:fmtCurrency(selMed.price),c:C.text},{l:"Category",v:selMed.category,c:C.text},{l:"Stock Value",v:fmtCurrency((selMed.quantity||0)*(selMed.price||0)),c:C.text}].map(x=>(
                <div key={x.l}><p style={{color:C.dim,fontSize:10,margin:0,textTransform:"uppercase",letterSpacing:"0.08em"}}>{x.l}</p><p style={{color:x.c,fontWeight:700,margin:0,fontSize:13}}>{x.v}</p></div>
              ))}
            </div>}
            <Field label="Quantity" required error={errors.quantity}><input type="number" min="1" value={form.quantity} onChange={e=>setF("quantity",e.target.value)} placeholder="Enter quantity" {...fi("qty")}/></Field>
            {selMed&&form.quantity&&!errors.quantity&&<p style={{color:C.muted,fontSize:13,marginTop:-4}}>Estimated deduction value: <strong style={{color:C.teal}}>{fmtCurrency(quickTotal)}</strong></p>}
            <Btn variant="primary" onClick={handleQuickStockOut} style={{width:"100%",justifyContent:"center"}}>Submit</Btn>
          </div>
        </Card>}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:700,color:C.text,margin:0}}>Fast Stock Out History <span style={{color:C.muted,fontWeight:400,fontSize:14}}>({stockOuts.length})</span></p>
            <Btn variant="ghost" size="sm" icon="download" onClick={()=>exportCSV(stockOuts,"stock-out.csv")}>Export</Btn>
          </div>
          <Card style={{marginBottom:14}}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by medicine, bill no, or type..."/>
          </Card>
          <Card>
            <Table
              cols={[
                {label:"Record",   render:r=><span style={{color:C.teal,fontWeight:700,fontSize:13}}>{r.billNo || r.transactionType || "SO"}</span>},
                {label:"Medicine", render:r=><p style={{color:C.text,fontWeight:700,margin:0,fontSize:13}}>{r.medicineName}</p>},
                {label:"Qty",      render:r=><span style={{fontWeight:700}}>{r.quantity}</span>},
                {label:"Type",     render:r=><span style={{color:C.muted,fontSize:13,textTransform:"capitalize"}}>{r.transactionType || "fast"}</span>},
                {label:"Patient",  render:r=><span style={{color:C.muted,fontSize:13}}>{r.patientName || "Walk-in Customer"}</span>},
                {label:"Date",     render:r=><span style={{color:C.muted,fontSize:13}}>{fmtDate(r.date)}</span>},
                {label:"",         render:r=> isAdmin ? <button onClick={()=>setDeleteId(r.id||r._id)} style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"inline-flex",alignItems:"center",borderRadius:8,color:C.dim,transition:"color 0.12s"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.dim}><Icon name="trash" size={14} color="currentColor"/></button> : <span style={{color:C.dim,fontSize:12}}>—</span>},
              ]}
              rows={filteredOuts}
              emptyMsg="No fast stock out records found"
            />
          </Card>
        </div>
      </div>
      <ConfirmModal open={!!deleteId} title="Delete Record" message="This will remove this fast stock out record. Stock will not be restored." onConfirm={handleDelete} onCancel={()=>setDeleteId(null)} confirmLabel="Delete Record"/>
    </div>
  );
}
