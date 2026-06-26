import React, { useState } from "react";
import { C } from "../theme";

// ═══════════════════════════════════════════════════════════════
// SVG ICON LIBRARY
// ═══════════════════════════════════════════════════════════════
export const Icon = ({ name, size = 16, color = "currentColor", style: sx = {} }) => {
  const s = { width: size, height: size, display: "inline-block", flexShrink: 0, ...sx };
  const icons = {
    dashboard:   <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    pill:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>,
    plus:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    calendar:    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>,
    box:         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>,
    stockout:    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    download:    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    search:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    warning:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    clock:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    coins:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><line x1="9.17" y1="11.25" x2="6.83" y2="11.25"/></svg>,
    list:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    ban:         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    check:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12"/></svg>,
    xmark:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    info:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    edit:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>,
    trash:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    hospital:    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>,
    user:        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    mappin:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    trenddown:   <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
    refresh:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
    activity:    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    arrowright:  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    close:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    alertcircle: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    shield:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><polyline points="9 12 11 14 15 10"/></svg>,
    receipt:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/></svg>,
  };
  return icons[name] || null;
};

// ═══════════════════════════════════════════════════════════════
// BASIC COMPONENTS
// ═══════════════════════════════════════════════════════════════
export function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel="Delete", danger=true }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(2px)"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:30,maxWidth:420,width:"90%",animation:"fadeUp 0.15s ease",boxShadow:"0 10px 25px rgba(0,0,0,0.1)"}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:600,color:C.text,marginBottom:8}}>{title}</p>
        <p style={{color:C.muted,fontSize:13,marginBottom:26,lineHeight:1.5}}>{message}</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, children, required }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:12,color:C.muted,fontWeight:500}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>
      {children}
      {error&&<span style={{fontSize:11,color:C.red}}>{error}</span>}
    </div>
  );
}

export const inputSt = (focus=false) => ({ width:"100%", padding:"8px 12px", borderRadius:6, border:`1px solid ${focus?C.teal:C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:"'Inter',sans-serif", outline:"none", transition:"border-color 0.15s, box-shadow 0.15s", boxSizing:"border-box", boxShadow:focus?`0 0 0 3px ${C.teal}20`:"none" });
export const selectSt = { width:"100%", padding:"8px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:"'Inter',sans-serif", outline:"none", cursor:"pointer" };

export function FInput({ label, required, error, ...props }) {
  const [f,setF]=useState(false);
  return <Field label={label} error={error} required={required}><input style={inputSt(f)} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...props}/></Field>;
}
export function FSelect({ label, required, error, options, ...props }) {
  return <Field label={label} error={error} required={required}><select style={selectSt} {...props}>{options.map(o=><option key={o} value={o} style={{background:C.surface}}>{o}</option>)}</select></Field>;
}
export function FTextarea({ label, required, error, ...props }) {
  const [f,setF]=useState(false);
  return <Field label={label} error={error} required={required}><textarea style={{...inputSt(f),resize:"vertical",minHeight:72}} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...props}/></Field>;
}

export function Badge({ label, color, bg }) {
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:4,background:bg,color,fontSize:11,fontWeight:600,border:`1px solid ${color}25`}}>{label}</span>;
}

export function Btn({ children, onClick, variant="primary", size="md", icon, disabled=false, style:sx={}, type="button" }) {
  const base = {display:"flex",alignItems:"center",gap:6,borderRadius:6,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontWeight:500,opacity:disabled?0.5:1,transition:"all 0.15s",...sx};
  const sizes = {sm:{padding:"6px 12px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"12px 24px",fontSize:14}};
  
  // Clean flat styles with border based on professional B2B guidelines
  const variants = {
    primary:   {background:C.teal, color:"#ffffff", border:`1px solid ${C.teal}`},
    secondary: {background:C.surface, color:C.text, border:`1px solid ${C.border}`},
    danger:    {background:"#fff1f2", color:C.red, border:`1px solid #fecdd3`},
    ghost:     {background:"transparent", color:C.muted, border:`1px solid transparent`},
    purple:    {background:"#f8fafc", color:C.purple, border:`1px solid #cbd5e1`},
  };
  const v = variants[variant];
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{...base,...sizes[size],...v}}>
      {icon&&<Icon name={icon} size={14} color="currentColor"/>}
      {children}
    </button>
  );
}

export function Card({ children, style:sx={} }) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...sx}}>{children}</div>;
}

export function SearchBar({ value, onChange, placeholder="Search..." }) {
  const [f,setF]=useState(false);
  return (
    <div style={{position:"relative",flex:1}}>
      <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex"}}>
        <Icon name="search" size={14} color={C.dim}/>
      </div>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...inputSt(f),paddingLeft:30}}/>
    </div>
  );
}

export function StatCard({ title, value, sub, accent, iconName, delay=0, onClick, ariaLabel }) {
  const isClickable = typeof onClick === "function";
  return (
    <button
      type="button"
      aria-label={ariaLabel || title}
      onClick={onClick}
      disabled={!isClickable}
      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px",display:"flex",flexDirection:"column",gap:8,position:"relative",overflow:"hidden",animation:`fadeUp 0.5s ease ${delay}s both`,boxShadow:"0 1px 2px rgba(0,0,0,0.02)",textAlign:"left",width:"100%",cursor:isClickable?"pointer":"default",outline:"none",transition:"transform 0.15s ease, box-shadow 0.15s ease",appearance:"none"}}
      onMouseEnter={e=>{if(isClickable){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,0.06)";}}}
      onMouseLeave={e=>{if(isClickable){e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,0.02)";}}}
    >
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
        <p style={{color:C.muted,fontSize:12,fontWeight:500,margin:0}}>{title}</p>
        <div style={{width:28,height:28,borderRadius:6,background:`${accent}12`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name={iconName} size={14} color={accent}/>
        </div>
      </div>
      <p style={{color:C.text,fontSize:24,fontWeight:600,margin:0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{value}</p>
      <p style={{color:accent,fontSize:12,margin:0}}>{sub}</p>
    </button>
  );
}

export function PageHdr({ tag, title, sub, accent=C.teal, actions }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,animation:"fadeUp 0.4s ease both"}}>
      <div>
        <p style={{fontSize:12,color:accent,fontWeight:600,marginBottom:4}}>{tag}</p>
        <h1 style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:700,color:C.text,letterSpacing:"-0.01em",lineHeight:1.1,margin:0}}>{title}</h1>
        {sub&&<p style={{color:C.muted,fontSize:13,marginTop:4}}>{sub}</p>}
      </div>
      {actions&&<div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>{actions}</div>}
    </div>
  );
}

export function Table({ cols, rows, emptyMsg="No data found" }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:`1px solid ${C.border}`}}>
            {cols.map(c=><th key={c.label} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length===0&&<tr><td colSpan={cols.length} style={{padding:"40px 16px",textAlign:"center",color:C.dim}}>{emptyMsg}</td></tr>}
          {rows.map((row,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {cols.map(c=><td key={c.label} style={{padding:"12px 14px",color:C.text,verticalAlign:"middle"}}>{c.render?c.render(row):row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
