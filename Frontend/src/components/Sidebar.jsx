import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { C } from "../theme";
import { Icon } from "./SharedUI";
import BrandLogo from "./BrandLogo";
import { getDaysToExpiry } from "../utils";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { iconName: "dashboard", label: "Dashboard", path: "/" },
  { iconName: "pill", label: "Medicines", path: "/medicines" },
  { iconName: "plus", label: "Add Medicine", path: "/add-medicine" },
  { iconName: "calendar", label: "Expiry Tracker", path: "/expiry-tracker" },
  { iconName: "box", label: "Stock Tracker", path: "/stock-tracker" },
  { iconName: "pos", label: "Point of Sale", path: "/pos" },
  { iconName: "receipt", label: "Make Bill", path: "/make-bill" },
  { iconName: "alertcircle", label: "Expired Medicines", path: "/expired-medicines" },
];

export default function Sidebar({ profile = {}, medicines = [], user, collapsed = false, onToggleCollapse, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const activePath = location.pathname;
  const width = collapsed ? 68 : 232;

  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const lowCount = medicines.filter(m => (m.quantity || 0) <= (m.threshold || 20)).length;
  const expCount = medicines.filter(m => { const d = getDaysToExpiry(m.expiryDate); return d >= 0 && d <= 30; }).length;

  const navBtnStyle = (isAct) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: collapsed ? 0 : 10,
    padding: collapsed ? "10px 0" : "10px 12px",
    borderRadius: 10,
    border: "none",
    background: isAct ? "rgba(var(--primary-rgb),0.08)" : "transparent",
    borderLeft: collapsed ? "none" : `2px solid ${isAct ? C.teal : "transparent"}`,
    color: isAct ? C.teal : C.muted,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: isAct ? 600 : 500,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Inter',sans-serif",
    textAlign: "left",
    width: "100%",
    position: "relative",
  });

  const footerBtn = {
    display: "flex",
    alignItems: "center",
    gap: collapsed ? 0 : 8,
    justifyContent: collapsed ? "center" : "flex-start",
    padding: collapsed ? "8px 0" : "8px 10px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 600,
    fontFamily: "'Inter',sans-serif",
    width: "100%",
    transition: "background 0.15s",
  };

  return (
    <aside style={{
      width,
      minWidth: width,
      height: "100%",
      padding: collapsed ? "16px 10px 18px" : "16px 14px 18px",
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      gap: 3,
      overflowY: "auto",
      overflowX: "hidden",
      flexShrink: 0,
      boxShadow: "2px 0 10px rgba(0,0,0,0.02)",
      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 8,
        marginBottom: 18,
        padding: collapsed ? "0" : "0 4px",
      }}>
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            style={{
              width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`,
              background: C.surfaceHover, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="arrowright" size={16} color={C.text} />
          </button>
        ) : (
          <>
            <BrandLogo size={26} showText textSize={15} />
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 5, borderRadius: 7,
                }}
              >
                <Icon name="arrowleft" size={16} color={C.muted} />
              </button>
            )}
          </>
        )}
      </div>

      {NAV.map(({ iconName, label, path }) => {
        const isAct = activePath === path;
        const badge = label === "Stock Tracker" && lowCount > 0 ? lowCount : label === "Expiry Tracker" && expCount > 0 ? expCount : null;
        return (
          <button key={label} onClick={() => go(path)} title={collapsed ? label : undefined} style={navBtnStyle(isAct)}
            onMouseEnter={e => { if (!isAct) { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { if (!isAct) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}>
            <span style={{ position: "relative", display: "flex", flexShrink: 0 }}>
              <Icon name={iconName} size={collapsed ? 17 : 14} color={isAct ? C.teal : C.dim} />
              {collapsed && badge && (
                <span style={{ position: "absolute", top: -4, right: -6, background: C.orange, color: "#fff", borderRadius: 20, padding: "0 4px", fontSize: 9, fontWeight: 700, lineHeight: "14px", minWidth: 14, textAlign: "center" }}>{badge}</span>
              )}
            </span>
            {!collapsed && (
              <>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</span>
                {badge && <span style={{ background: C.orange, color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700, lineHeight: "16px" }}>{badge}</span>}
              </>
            )}
          </button>
        );
      })}

      <div style={{ flex: 1, minHeight: 16 }} />

      <div style={{
        display: "flex", flexDirection: "column", gap: 7,
        padding: collapsed ? "12px 2px 4px" : "12px 6px 4px",
        marginTop: 6,
        borderTop: `1px solid ${C.border}`,
      }}>
        <button onClick={() => go("/contact-us")} title={collapsed ? "Contact Us" : undefined}
          style={{ ...footerBtn, color: C.text, justifyContent: collapsed ? "center" : "flex-start", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
          <Icon name="info" size={collapsed ? 15 : 13} color={C.dim} />
          {!collapsed && <span>Contact Us</span>}
        </button>

        <div role="button" tabIndex={0} title={collapsed ? (theme === "dark" ? "Dark Mode" : "Light Mode") : undefined}
          style={{ ...footerBtn, justifyContent: collapsed ? "center" : "space-between", textAlign: "left" }}
          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = C.surface}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTheme(theme === "dark" ? "light" : "dark"); } }}>
          <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 8 }}>
            <Icon name="refresh" size={collapsed ? 15 : 13} color={C.dim} />
            {!collapsed && <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>}
          </div>
          {!collapsed && (
            <span aria-hidden="true" style={{ width: 30, height: 18, borderRadius: 20, background: theme === "dark" ? C.teal : C.muted, position: "relative", flexShrink: 0, display: "inline-block" }}>
              <span style={{ position: "absolute", top: 2, left: theme === "dark" ? 13 : 2, width: 14, height: 14, borderRadius: "50%", background: "#ffffff", transition: "left 0.3s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
            </span>
          )}
        </div>

        <button onClick={logout} title={collapsed ? "Sign Out" : undefined}
          style={{ ...footerBtn, color: C.red, justifyContent: collapsed ? "center" : "flex-start", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
          <Icon name="stockout" size={collapsed ? 15 : 13} color={C.red} />
          {!collapsed && <span>Sign Out{user?.name ? ` (${user.name.split(" ")[0]})` : ""}</span>}
        </button>
      </div>
    </aside>
  );
}
