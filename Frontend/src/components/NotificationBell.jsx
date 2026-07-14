import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { Icon, Btn } from "./SharedUI";
import { getDaysToExpiry } from "../utils";

const STORAGE_KEY = "pharmacy_notifications_read";

function buildNotifications(medicines = []) {
  const items = [];

  medicines.filter((m) => m.quantity === 0).slice(0, 5).forEach((m) => {
    items.push({
      id: `oos-${m._id || m.id}`,
      type: "danger",
      title: "Out of Stock",
      message: `${m.name} has zero stock`,
      time: "Now",
      path: "/stock-tracker?filter=low",
    });
  });

  medicines.filter((m) => m.quantity > 0 && m.quantity <= (m.threshold || 20)).slice(0, 5).forEach((m) => {
    items.push({
      id: `low-${m._id || m.id}`,
      type: "warning",
      title: "Low Stock",
      message: `${m.name} — only ${m.quantity} left`,
      time: "Today",
      path: "/stock-tracker?filter=low",
    });
  });

  medicines.filter((m) => {
    const d = getDaysToExpiry(m.expiryDate);
    return d >= 0 && d <= 30;
  }).slice(0, 5).forEach((m) => {
    items.push({
      id: `exp-${m._id || m.id}`,
      type: "info",
      title: "Expiring Soon",
      message: `${m.name} expires in ${getDaysToExpiry(m.expiryDate)} days`,
      time: "Today",
      path: "/expiry-tracker",
    });
  });

  medicines.filter((m) => getDaysToExpiry(m.expiryDate) < 0).slice(0, 3).forEach((m) => {
    items.push({
      id: `expired-${m._id || m.id}`,
      type: "danger",
      title: "Expired",
      message: `${m.name} has expired`,
      time: "Action needed",
      path: "/expired-medicines",
    });
  });

  return items.slice(0, 12);
}

export default function NotificationBell({ medicines = [] }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const notifications = useMemo(() => buildNotifications(medicines), [medicines]);
  const unread = notifications.filter((n) => !readIds.includes(n.id));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = () => setReadIds(notifications.map((n) => n.id));
  const clearAll = () => {
    setReadIds(notifications.map((n) => n.id));
    setOpen(false);
  };

  const handleOpen = (n) => {
    setReadIds((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
    setOpen(false);
    if (n.path) navigate(n.path);
  };

  const typeColor = { danger: C.red, warning: C.orange, info: C.teal };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
          background: open ? C.surfaceHover : C.surface, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          transition: "background 0.15s",
        }}
      >
        <Icon name="bell" size={18} color={C.text} />
        {unread.length > 0 && (
          <span style={{
            position: "absolute", top: 6, right: 6, width: 8, height: 8,
            borderRadius: "50%", background: C.red, border: "2px solid #fff",
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, width: 360,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
          boxShadow: "0 16px 40px rgba(15,23,42,0.14)", zIndex: 1200, overflow: "hidden",
          animation: "fadeUp 0.15s ease",
        }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Notifications</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{unread.length} unread</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 600, color: C.teal, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>Mark read</button>
              <button onClick={clearAll} style={{ fontSize: 11, fontWeight: 600, color: C.red, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>Clear</button>
            </div>
          </div>

          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p style={{ padding: "32px 18px", textAlign: "center", color: C.muted, fontSize: 13, margin: 0 }}>No notifications right now</p>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleOpen(n)}
                    style={{
                      width: "100%", textAlign: "left", padding: "14px 18px",
                      border: "none", borderBottom: `1px solid ${C.border}`,
                      background: isRead ? "transparent" : "rgba(var(--primary-rgb),0.04)",
                      cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                      background: isRead ? C.border : (typeColor[n.type] || C.teal),
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{n.title}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{n.message}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: C.dim }}>{n.time}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center" }}>
              <Btn variant="ghost" size="sm" onClick={() => { setOpen(false); navigate("/stock-tracker"); }}>View all alerts</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
