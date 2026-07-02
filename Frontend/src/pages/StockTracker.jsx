import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { C } from "../theme";
import { getStockStatus, getDaysToExpiry, fmtDate, fmtCurrency } from "../utils";
import { Btn, Card, PageHdr, StatCard, Table, SearchBar, Badge, Field, Icon, inputSt } from "../components/SharedUI";

const FILTER_MAP = {
  all: "All",
  low: "Low",
  in_stock: "In Stock",
  instock: "In Stock",
  "in-stock": "In Stock",
};

const resolveFilter = (value) => FILTER_MAP[String(value || "all").toLowerCase()] || "All";

export default function StockTracker({ medicines = [], addOrUpdateMedicine, toast, canWrite = true }) {
  const [searchParams] = useSearchParams();
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState(()=>resolveFilter(searchParams.get("filter")));
  const [restockMed,setRestockMed]=useState(null);
  const [restockQty,setRestockQty]=useState("");
  const [focusRQ,setFocusRQ]=useState(false);

  useEffect(()=>{
    setFilter(resolveFilter(searchParams.get("filter")));
  },[searchParams]);

  const filtered=medicines
    .filter(m=>m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m=>{if(filter==="All")return true;const s=getStockStatus(m.quantity,m.threshold||10).label;return filter==="Low"?["Critical Low","Low Stock","Out of Stock"].includes(s):s==="In Stock";})
    .sort((a,b)=>(a.quantity/Math.max(a.threshold||10,1))-(b.quantity/Math.max(b.threshold||10,1)));

  const handleRestock = async () => {
    const qty=Number(restockQty);
    if(!qty||qty<=0){toast("Enter a valid quantity","error");return;}
    try {
      const updatedMed = { ...restockMed, quantity: restockMed.quantity + qty };
      await addOrUpdateMedicine(updatedMed);
      toast(`Added ${qty} units to ${restockMed.name}`);
      setRestockMed(null);
      setRestockQty("");
    } catch (err) {
      toast("Failed to restock: " + err.message, "error");
    }
  };

  const oos=medicines.filter(m=>m.quantity===0).length;
  const low=medicines.filter(m=>m.quantity>0&&m.quantity<=(m.threshold||10)).length;
  const tv=medicines.reduce((s,m)=>s+(m.quantity||0)*(m.price||0),0);

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Inventory" title="Stock Tracker" sub="Monitor and manage medicine stock levels"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <StatCard title="Total SKUs"   value={medicines.length}              sub="Medicine types"      accent={C.teal}   iconName="list"    delay={0}/>
        <StatCard title="Out of Stock" value={oos}                           sub="Immediate action"    accent={C.red}    iconName="ban"     delay={0.05}/>
        <StatCard title="Low Stock"    value={low}                           sub="Below threshold"     accent={C.orange} iconName="warning" delay={0.1}/>
        <StatCard title="Stock Value"  value={`₹${(tv/1000).toFixed(1)}K`}  sub="Inventory worth"     accent={C.purple} iconName="coins"   delay={0.15}/>
      </div>
      <Card>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search medicines..."/>
          {["All","Low","In Stock"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"9px 16px",borderRadius:9,border:`1px solid ${filter===f?C.teal:C.border}`,background:filter===f?"rgba(var(--primary-rgb),0.08)":"transparent",color:filter===f?C.teal:C.muted,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",transition:"all 0.15s"}} onMouseEnter={e=>{if(filter!==f)e.currentTarget.style.background=C.surfaceHover}} onMouseLeave={e=>{if(filter!==f)e.currentTarget.style.background="transparent"}}>{f==="Low"?"Low / Critical":f}</button>
          ))}
        </div>
        <Table
          cols={[
            {label:"Medicine",   render:r=><div><p style={{color:C.text,fontWeight:600,margin:0}}>{r.name}</p><p style={{color:C.muted,fontSize:11,margin:0}}>{r.category} · {r.unit||"Tablets"}</p></div>},
            {label:"Stock Level",render:r=>{const pct=Math.min(100,Math.round((r.quantity/Math.max((r.threshold||10)*2,1))*100));const s=getStockStatus(r.quantity,r.threshold||10);return <div style={{minWidth:170}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:C.text,fontWeight:600,fontSize:12}}>{r.quantity} / {r.threshold||10} min</span><Badge {...s}/></div><div style={{height:5,borderRadius:3,background:C.border}}><div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:s.color,transition:"width 0.6s ease"}}/></div></div>;}},
            {label:"Price/Unit", render:r=><span style={{color:C.teal,fontWeight:600}}>{fmtCurrency(r.price)}</span>},
            {label:"Stock Value",render:r=><span style={{color:C.muted}}>{fmtCurrency((r.quantity||0)*(r.price||0))}</span>},
            {label:"Expiry",     render:r=><span style={{color:getDaysToExpiry(r.expiryDate)<90?C.orange:C.muted,fontSize:12}}>{fmtDate(r.expiryDate)}</span>},
            {label:"Action",     render:r=>canWrite?<Btn variant="purple" size="sm" icon="refresh" onClick={()=>{setRestockMed(r);setRestockQty("");}}>Restock</Btn>:<span style={{color:C.dim,fontSize:12}}>—</span>},
          ]}
          rows={filtered}
        />
      </Card>
      {restockMed&&(
        createPortal(
          <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
            <div role="dialog" aria-modal="true" aria-labelledby="restock-modal-title" style={{width:"100%",maxWidth:720,maxHeight:"90vh",overflow:"hidden",borderRadius:20,border:`1px solid ${C.border}`,background:C.surface,boxShadow:"0 24px 60px rgba(15,23,42,0.18)",display:"flex",flexDirection:"column",animation:"fadeUp 0.2s ease"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,borderBottom:`1px solid ${C.border}`,padding:"20px 24px",flexShrink:0}}>
                <div>
                  <p style={{margin:0,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,color:C.teal}}>Inventory</p>
                  <h2 id="restock-modal-title" style={{margin:"4px 0 0",fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:C.text}}>Restock Medicine</h2>
                </div>
                <button onClick={()=>setRestockMed(null)} aria-label="Close modal" style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceHover,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={16} color={C.muted}/></button>
              </div>

              <div style={{overflowY:"auto",padding:"20px 24px",flex:1}}>
                <div style={{background:"rgba(0,184,141,0.05)",border:`1px solid rgba(0,184,141,0.12)`,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
                  <p style={{margin:0,color:C.text,fontSize:14,fontWeight:700}}>{restockMed.name}</p>
                  <p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>Current stock: <strong style={{color:C.teal}}>{restockMed.quantity} {restockMed.unit||"Tablets"}</strong></p>
                </div>
                <Field label="Quantity to Add" required>
                  <input type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="Enter quantity..." style={inputSt(focusRQ)} onFocus={()=>setFocusRQ(true)} onBlur={()=>setFocusRQ(false)}/>
                </Field>
                {restockQty&&<p style={{color:C.muted,fontSize:13,marginTop:10}}>New total: <strong style={{color:C.teal}}>{restockMed.quantity+Number(restockQty||0)} {restockMed.unit||"Tablets"}</strong></p>}
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10,borderTop:`1px solid ${C.border}`,padding:"16px 24px",flexShrink:0}}>
                <Btn variant="ghost" onClick={()=>setRestockMed(null)}>Cancel</Btn>
                <Btn variant="primary" onClick={handleRestock}>Confirm Restock</Btn>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
