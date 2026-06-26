import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { C } from "../theme";
import { Icon } from "./SharedUI";
import { getDaysToExpiry } from "../utils";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {iconName:"dashboard", label:"Dashboard", path: "/"},
  {iconName:"pill",      label:"Medicines", path: "/medicines"},
  {iconName:"calendar",  label:"Expiry Tracker", path:"/expiry-tracker"},
  {iconName:"box",       label:"Stock Tracker", path:"/stock-tracker"},
  {iconName:"stockout",  label:"Stock Out", path:"/stock-out"},
];

export default function Sidebar({ profile = {}, medicines = [], user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const activePath = location.pathname;

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const lowCount   = medicines.filter(m=>(m.quantity||0)<=(m.threshold||10)).length;
  const expCount   = medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>=0&&d<=30;}).length;

  return (
    <aside style={{width:220,padding:"16px 12px",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:2,overflowY:"auto",flexShrink:0,boxShadow:"2px 0 10px rgba(0,0,0,0.02)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,padding:"0 10px"}}>
        <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,var(--primary),var(--slate))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#ffffff",fontFamily:"'Inter',sans-serif",letterSpacing:"-0.02em"}}>Rx</div>
        <span style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:16,color:C.text}}>PharmaCare</span>
      </div>

      {NAV.map(({iconName,label,path},i)=>{
        const isAct=activePath===path;
        const badge=label==="Stock Tracker"&&lowCount>0?lowCount:label==="Expiry Tracker"&&expCount>0?expCount:null;
        return (
          <button key={label} onClick={()=>navigate(path)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",background:isAct?"rgba(var(--primary-rgb),0.08)":"transparent",borderLeft:`2px solid ${isAct?C.teal:"transparent"}`,color:isAct?C.teal:C.muted,cursor:"pointer",fontSize:13,fontWeight:isAct?600:500,transition:"all 0.12s",fontFamily:"'Inter',sans-serif",textAlign:"left",width:"100%",animation:`slideIn 0.4s ease ${0.04*i}s both`}}
            onMouseEnter={e=>{if(!isAct){e.currentTarget.style.background=C.surfaceHover;e.currentTarget.style.color=C.text;}}}
            onMouseLeave={e=>{if(!isAct){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted;}}}>
            <Icon name={iconName} size={15} color={isAct?C.teal:C.dim}/>
            <span style={{flex:1}}>{label}</span>
            {badge&&<span style={{background:C.orange,color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:700,lineHeight:"16px"}}>{badge}</span>}
          </button>
        );
      })}

      <div style={{flex:1,minHeight:16}}/>

      {/* Footer Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={()=>navigate("/contact-us")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.surface,color:C.text,cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.12s",fontFamily:"'Inter',sans-serif",textAlign:"left",width:"100%"}}
          onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceHover;}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.surface;}}>
          <Icon name="info" size={15} color={C.dim}/>
          <span style={{flex:1}}>Contact Us</span>
        </button>

        <div
          role="button"
          tabIndex={0}
          style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.surface,width:"100%",transition:"all 0.12s",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.surfaceHover}
          onMouseLeave={e=>e.currentTarget.style.background=C.surface}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTheme(theme==='dark'?'light':'dark');}}}
        >
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Icon name="refresh" size={15} color={C.dim}/>
            <span style={{fontSize:13,fontWeight:500,color:C.text,fontFamily:"'Inter',sans-serif"}}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span aria-hidden="true" style={{width:36,height:22,borderRadius:20,background:theme==='dark'?C.teal:C.muted,border:"none",position:"relative",flexShrink:0,display:"inline-block"}}>
            <span style={{position:"absolute",top:2,left:theme==='dark'?16:2,width:18,height:18,borderRadius:"50%",background:"#ffffff",transition:"left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </span>
        </div>

        <button onClick={logout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.surface,color:C.red,cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.12s",fontFamily:"'Inter',sans-serif",textAlign:"left",width:"100%"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.06)";}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.surface;}}>
          <Icon name="stockout" size={15} color={C.red}/>
          <span style={{flex:1}}>Sign Out{user?.name ? ` (${user.name.split(" ")[0]})` : ""}</span>
        </button>
      </div>
    </aside>
  );
}