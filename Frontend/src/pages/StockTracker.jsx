import React, { useEffect, useState } from "react";
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
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:28,width:360,animation:"fadeUp 0.2s ease",boxShadow:"0 10px 40px rgba(0,0,0,0.1)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,color:C.text,margin:0}}>Restock Medicine</p>
              <button onClick={()=>setRestockMed(null)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",padding:4}}><Icon name="close" size={15} color={C.muted}/></button>
            </div>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>{restockMed.name} · Current: <strong style={{color:C.teal}}>{restockMed.quantity} {restockMed.unit||"Tablets"}</strong></p>
            <Field label="Quantity to Add" required>
              <input type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="Enter quantity..." style={inputSt(focusRQ)} onFocus={()=>setFocusRQ(true)} onBlur={()=>setFocusRQ(false)}/>
            </Field>
            {restockQty&&<p style={{color:C.muted,fontSize:12,marginTop:8}}>New total: <strong style={{color:C.teal}}>{restockMed.quantity+Number(restockQty||0)} {restockMed.unit||"Tablets"}</strong></p>}
            <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setRestockMed(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleRestock}>Confirm Restock</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
