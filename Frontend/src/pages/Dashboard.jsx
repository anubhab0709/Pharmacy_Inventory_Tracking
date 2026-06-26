import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { C } from "../theme";
import { exportCSV, exportPDF, getDaysToExpiry, getStockStatus, getExpiryStatus, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, StatCard, Table, Badge } from "../components/SharedUI";

function AlertBanner({ iconName, color, title, sub, onView }) {
  return (
    <div style={{flex:1,minWidth:210,background:`${color}12`,border:`1px solid ${color}28`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:36,height:36,borderRadius:10,background:`${color}1a`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name={iconName} size={17} color={color}/>
      </div>
      <div style={{flex:1}}>
        <p style={{color,fontWeight:700,fontSize:13,margin:0}}>{title}</p>
        <p style={{color:C.muted,fontSize:11,margin:0}}>{sub}</p>
      </div>
      <Btn variant="ghost" size="sm" onClick={onView}>View</Btn>
    </div>
  );
}

function MiniList({ title, sub, items, emptyMsg, onViewAll, renderRow }) {
  return (
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.text,margin:0}}>{title}</p>
          <p style={{color:C.muted,fontSize:12,margin:0}}>{sub}</p>
        </div>
        {onViewAll && <Btn variant="ghost" size="sm" icon="arrowright" onClick={onViewAll}>View All</Btn>}
      </div>
      {items.length === 0
        ? <p style={{color:C.dim,textAlign:"center",padding:"24px 0",fontSize:13}}>{emptyMsg}</p>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>{items.map(renderRow)}</div>
      }
    </Card>
  );
}

export default function Dashboard({ medicines = [], stockOuts = [], navigate }) {
  const totalStock = medicines.reduce((s,m)=>s+(m.quantity||0),0);
  const lowStock   = medicines.filter(m=>(m.quantity||0)<=(m.threshold||0) && (m.quantity||0)>0).length;
  const outOfStock = medicines.filter(m=>(m.quantity||0)===0).length;
  const expSoon    = medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>=0&&d<=30;}).length;
  const expired    = medicines.filter(m=>getDaysToExpiry(m.expiryDate)<0).length;
  const inStock    = medicines.filter(m=>{
    const q=m.quantity||0; const t=m.threshold||0;
    return q>0 && q>t && getDaysToExpiry(m.expiryDate)>30;
  }).length;
  const totalValue = medicines.reduce((s,m)=>s+(m.quantity||0)*(m.price||0),0);
  const recentOuts = [...stockOuts].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  const healthData = [
    { name:"In Stock", value:inStock, color:C.teal },
    { name:"Low Stock", value:lowStock, color:C.orange },
    { name:"Out of Stock", value:outOfStock, color:C.red },
    { name:"Expiring", value:expSoon, color:C.yellow },
    { name:"Expired", value:expired, color:"#991b1b" },
  ].filter(d=>d.value>0);

  const last7Days = Array.from({length:7},(_,i)=>{
    const d=new Date();
    d.setDate(d.getDate()-(6-i));
    const key=d.toISOString().split("T")[0];
    const label=d.toLocaleDateString("en-IN",{weekday:"short"});
    const count=stockOuts.filter(s=>{
      const sd=new Date(s.date).toISOString().split("T")[0];
      return sd===key;
    }).reduce((sum,s)=>sum+(s.quantity||0),0);
    return { name:label, units:count, date:key };
  });

  const expiringSoon = [...medicines]
    .filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>=0&&d<=90;})
    .sort((a,b)=>getDaysToExpiry(a.expiryDate)-getDaysToExpiry(b.expiryDate))
    .slice(0,5);

  const lowStockItems = [...medicines]
    .filter(m=>(m.quantity||0)<=(m.threshold||10))
    .sort((a,b)=>(a.quantity||0)-(b.quantity||0))
    .slice(0,5);

  const goTo = (path) => navigate(path);
  const goToExpiry = (filter) => navigate(`/expiry-tracker?filter=${encodeURIComponent(filter)}`);
  const goToStock = (filter) => navigate(`/stock-tracker?filter=${encodeURIComponent(filter)}`);

  const handleExportPdf = () => {
    exportPDF({
      title: "PharmaCare Dashboard Report",
      subtitle: "Inventory summary and recent dispensing activity",
      filename: "pharmacare-dashboard",
      rows: medicines.map(medicine => ({
        name: medicine.name,
        category: medicine.category,
        quantity: medicine.quantity,
        unit: medicine.unit || "Tablets",
        expiryDate: fmtDate(medicine.expiryDate),
        price: fmtCurrency(medicine.price),
      })),
      columns: [
        { label: "Medicine", key: "name" },
        { label: "Category", key: "category" },
        { label: "Stock", key: "quantity" },
        { label: "Unit", key: "unit" },
        { label: "Expiry", key: "expiryDate" },
        { label: "Price", key: "price" },
      ],
    });
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Overview" title="Dashboard" sub="Real-time insights into your pharmacy inventory"
        actions={[
          <Btn key="csv" variant="ghost" icon="download" onClick={()=>exportCSV({
            rows: medicines.map(medicine => ({
              name: medicine.name,
              category: medicine.category,
              quantity: medicine.quantity,
              unit: medicine.unit || "Tablets",
              expiryDate: fmtDate(medicine.expiryDate),
              price: fmtCurrency(medicine.price),
            })),
            columns: [
              { label: "Medicine", key: "name" },
              { label: "Category", key: "category" },
              { label: "Stock", key: "quantity" },
              { label: "Unit", key: "unit" },
              { label: "Expiry", key: "expiryDate" },
              { label: "Price", key: "price" },
            ],
            filename: "medicines.csv",
          })}>Export CSV</Btn>,
          <Btn key="pdf" variant="primary" icon="download" onClick={handleExportPdf}>Export PDF</Btn>
        ]}
      />
      {(expired>0||expSoon>0||lowStock>0||outOfStock>0)&&(
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          {expired>0 &&<AlertBanner iconName="alertcircle" color={C.red}    title={`${expired} Medicine${expired>1?"s":""} Expired`}          sub="Remove from shelf immediately"   onView={()=>goToExpiry("expired")}/>}
          {expSoon>0 &&<AlertBanner iconName="clock"       color={C.orange} title={`${expSoon} Expiring within 30 days`}                       sub="Plan disposal or return"          onView={()=>goToExpiry("critical")}/>}
          {lowStock>0&&<AlertBanner iconName="trenddown"   color={C.yellow} title={`${lowStock} Low Stock Alert${lowStock>1?"s":""}`}           sub="Below minimum threshold"         onView={()=>goToStock("low")}/>}
          {outOfStock>0&&<AlertBanner iconName="ban"        color={C.red}    title={`${outOfStock} Out of Stock`}                              sub="Restock immediately"            onView={()=>goToStock("low")}/>}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14,marginBottom:22}}>
        <StatCard title="Total Medicines" value={medicines.length}                      sub={`${outOfStock} out of stock`} accent={C.teal}   iconName="pill"      delay={0.04} onClick={()=>goTo("/medicines")} ariaLabel="Open medicines list"/>
        <StatCard title="Total Stock"     value={totalStock.toLocaleString()}           sub="Units in inventory"      accent={C.purple} iconName="box"       delay={0.07} onClick={()=>goToStock("all")} ariaLabel="Open stock tracker"/>
        <StatCard title="Stock Value"     value={`₹${(totalValue/1000).toFixed(1)}K`}  sub="Total inventory worth"   accent={C.green}  iconName="coins"     delay={0.10} onClick={()=>goToStock("in-stock")} ariaLabel="Open stocked medicines"/>
        <StatCard title="Dispensed Today" value={last7Days[6]?.units||0}                  sub="Units dispensed today"   accent={C.teal}   iconName="receipt"   delay={0.13} onClick={()=>goTo("/stock-out")} ariaLabel="Open stock out"/>
        <StatCard title="Expiry Alerts"   value={expSoon+expired}                       sub="Within 30 days / expired"accent={C.red}    iconName="clock"     delay={0.16} onClick={()=>goToExpiry("critical")} ariaLabel="Open expiry tracker"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:18,marginBottom:18}}>
        <Card>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.text,margin:"0 0 2px"}}>Inventory Health Status</p>
          <p style={{color:C.muted,fontSize:12,marginBottom:16}}>Stock and expiry breakdown — act on alerts fast</p>
          {healthData.length===0
            ? <p style={{color:C.dim,textAlign:"center",padding:"60px 0",fontSize:13}}>No medicines in inventory yet</p>
            : <ResponsiveContainer width="100%" height={220}>
              <BarChart data={healthData} barCategoryGap="25%">
                <XAxis dataKey="name" tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12}} formatter={(v)=>[`${v} medicines`,"Count"]} cursor={{fill:"rgba(0,0,0,0.03)"}}/>
                <Bar dataKey="value" radius={[5,5,0,0]} label={{position:"top",fill:C.teal,fontSize:10,fontWeight:600}}>
                  {healthData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        </Card>
        <Card>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.text,margin:"0 0 2px"}}>Weekly Dispensing Trend</p>
          <p style={{color:C.muted,fontSize:12,marginBottom:16}}>Units dispensed over the last 7 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7Days} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12}} formatter={(v)=>[`${v} units`,"Dispensed"]} cursor={{fill:"rgba(0,0,0,0.03)"}}/>
              <Bar dataKey="units" fill={C.teal} radius={[5,5,0,0]} label={{position:"top",fill:C.teal,fontSize:10,fontWeight:600}}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <MiniList
          title="Expiring Soon"
          sub="Medicines expiring within 90 days"
          items={expiringSoon}
          emptyMsg="No medicines expiring soon"
          onViewAll={()=>goToExpiry("critical")}
          renderRow={(m)=>{
            const st=getExpiryStatus(m.expiryDate);
            const days=getDaysToExpiry(m.expiryDate);
            return (
              <div key={m._id||m.id||m.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceHover}}>
                <div>
                  <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>{m.name}</p>
                  <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>{fmtDate(m.expiryDate)} · {days} days left · {m.quantity} {m.unit||"units"}</p>
                </div>
                <Badge {...st}/>
              </div>
            );
          }}
        />
        <MiniList
          title="Low Stock Alerts"
          sub="Medicines at or below threshold"
          items={lowStockItems}
          emptyMsg="All medicines are adequately stocked"
          onViewAll={()=>goToStock("low")}
          renderRow={(m)=>{
            const st=getStockStatus(m.quantity,m.threshold||10);
            return (
              <div key={m._id||m.id||m.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceHover}}>
                <div>
                  <p style={{color:C.text,fontWeight:600,fontSize:13,margin:0}}>{m.name}</p>
                  <p style={{color:C.muted,fontSize:11,margin:"2px 0 0"}}>{m.quantity} / {m.threshold||10} min · {fmtCurrency(m.price)}/unit</p>
                </div>
                <Badge {...st}/>
              </div>
            );
          }}
        />
      </div>

      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:C.text,margin:0}}>Recent Dispensing Activity</p>
            <p style={{color:C.muted,fontSize:12,margin:0}}>Last 5 transactions</p>
          </div>
          <Btn variant="ghost" size="sm" icon="arrowright" onClick={()=>navigate("/stock-out")}>View All</Btn>
        </div>
        {recentOuts.length===0
          ? <p style={{color:C.dim,textAlign:"center",padding:"28px 0",fontSize:13}}>No dispensing activity yet</p>
          : <Table
              cols={[
                {label:"Bill No",  render:r=><span style={{color:C.teal,fontWeight:700,fontSize:12,fontFamily:"'Inter',sans-serif"}}>{r.billNo}</span>},
                {label:"Medicine", key:"medicineName"},
                {label:"Qty",      render:r=><span style={{fontWeight:700}}>{r.quantity}</span>},
                {label:"Patient",  key:"patientName"},
                {label:"Doctor",   render:r=><span style={{color:C.muted}}>{r.prescribedBy||"—"}</span>},
                {label:"Date",     render:r=><span style={{color:C.muted,fontSize:12}}>{fmtDate(r.date)}</span>},
              ]}
              rows={recentOuts}
            />
        }
      </Card>
    </div>
  );
}
