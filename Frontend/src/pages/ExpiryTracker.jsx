import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { C } from "../theme";
import { exportCSV, getDaysToExpiry, getExpiryStatus, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, Badge } from "../components/SharedUI";

const FILTER_MAP = {
  all: "All",
  expired: "Expired",
  critical: "Critical",
  soon: "Expiring Soon",
  warning: "Warning",
  safe: "Safe",
};

const resolveFilter = (value) => FILTER_MAP[String(value || "all").toLowerCase()] || "All";

export default function ExpiryTracker({ medicines = [] }) {
  const [searchParams] = useSearchParams();
  const [filter,setFilter]=useState(()=>resolveFilter(searchParams.get("filter")));

  useEffect(()=>{
    setFilter(resolveFilter(searchParams.get("filter")));
  },[searchParams]);

  const sorted=[...medicines].sort((a,b)=>new Date(a.expiryDate)-new Date(b.expiryDate));
  const filtered=sorted.filter(m=>filter==="All"||getExpiryStatus(m.expiryDate).label===filter);
  const counts={
    expired:medicines.filter(m=>getDaysToExpiry(m.expiryDate)<0).length,
    critical:medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>=0&&d<=30;}).length,
    soon:medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>30&&d<=90;}).length,
    safe:medicines.filter(m=>getDaysToExpiry(m.expiryDate)>90).length,
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Compliance" title="Expiry Tracker" sub="Monitor medicine shelf life and regulatory compliance"
        actions={[<Btn key="e" variant="ghost" icon="download" size="sm" onClick={()=>exportCSV({
          rows: filtered.map(medicine => ({
            name: medicine.name,
            manufacturer: medicine.manufacturer,
            batchNo: medicine.batchNo || medicine.batchNumber,
            category: medicine.category,
            expiryDate: fmtDate(medicine.expiryDate),
            daysLeft: getDaysToExpiry(medicine.expiryDate),
            stock: `${medicine.quantity} ${medicine.unit || "Tablets"}`,
            status: getExpiryStatus(medicine.expiryDate).label,
          })),
          columns: [
            { label: "Medicine", key: "name" },
            { label: "Manufacturer", key: "manufacturer" },
            { label: "Batch No", key: "batchNo" },
            { label: "Category", key: "category" },
            { label: "Expiry Date", key: "expiryDate" },
            { label: "Days Left", key: "daysLeft" },
            { label: "Stock", key: "stock" },
            { label: "Status", key: "status" },
          ],
          filename: "expiry-report.csv",
        })}>Export Report</Btn>]}
      />
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {[{l:"Expired",v:counts.expired,col:C.red,icon:"alertcircle",f:"Expired"},
          {l:"Critical (≤30d)",v:counts.critical,col:C.red,icon:"clock",f:"Critical"},
          {l:"Expiring Soon",v:counts.soon,col:C.orange,icon:"warning",f:"Expiring Soon"},
          {l:"Safe",v:counts.safe,col:C.teal,icon:"shield",f:"Safe"}].map(s=>(
          <div key={s.l} onClick={()=>setFilter(s.f)} style={{background:C.surface,border:`1px solid ${filter===s.f?s.col+"44":C.border}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:12,boxShadow:filter===s.f?`0 4px 14px ${s.col}10`:"0 2px 10px rgba(0,0,0,0.02)"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceHover;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface;}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${s.col}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name={s.icon} size={17} color={s.col}/>
            </div>
            <div>
              <p style={{fontSize:26,fontWeight:800,color:s.col,fontFamily:"'Inter',sans-serif",margin:0,lineHeight:1}}>{s.v}</p>
              <p style={{color:C.muted,fontSize:11,margin:0,marginTop:2}}>{s.l}</p>
            </div>
          </div>
        ))}
      </div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.text,margin:0}}>Expiry Status Report</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["All","Expired","Critical","Expiring Soon","Warning","Safe"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filter===f?C.teal:C.border}`,background:filter===f?"rgba(var(--primary-rgb),0.08)":"transparent",color:filter===f?C.teal:C.muted,fontSize:11,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.12s"}}>{f}</button>
            ))}
          </div>
        </div>
        <Table
          cols={[
            {label:"Medicine",   render:r=><div><p style={{color:C.text,fontWeight:600,margin:0}}>{r.name}</p><p style={{color:C.muted,fontSize:11,margin:0}}>{r.manufacturer}</p></div>},
            {label:"Batch No",   render: r => r.batchNo || r.batchNumber},
            {label:"Category",   render:r=><span style={{color:C.purple,fontWeight:600,fontSize:12}}>{r.category}</span>},
            {label:"Expiry Date",render:r=><span style={{fontSize:12}}>{fmtDate(r.expiryDate)}</span>},
            {label:"Days Left",  render:r=>{const d=getDaysToExpiry(r.expiryDate);return <span style={{color:d<0?C.red:d<=30?C.red:d<=90?C.orange:C.teal,fontWeight:700,fontSize:12}}>{d<0?`${Math.abs(d)}d overdue`:d===0?"Today":`${d} days`}</span>;}},
            {label:"Stock",      render:r=><span style={{fontSize:12}}>{r.quantity} {r.unit||"Tablets"}</span>},
            {label:"Status",     render:r=><Badge {...getExpiryStatus(r.expiryDate)}/>},
          ]}
          rows={filtered}
          emptyMsg="No medicines match this filter"
        />
      </Card>
    </div>
  );
}
