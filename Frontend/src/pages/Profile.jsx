import React, { useState, useEffect } from "react";
import { C } from "../theme";
import { Icon, Btn, Card, PageHdr, FInput, FTextarea } from "../components/SharedUI";

function shopInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "RX";
}

export default function Profile({ profile = {}, updateProfileApi, toast }) {
  const [form, setForm] = useState({ ...profile });
  const [editing, setEditing] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    setForm({ ...profile });
  }, [profile]);

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        avatar: shopInitials(form.pharmacyName || profile.pharmacyName),
      };
      await updateProfileApi(payload);
      toast("Profile updated successfully");
      setEditing(false);
    } catch (err) {
      toast("Failed to update profile: " + err.message, "error");
    }
  };

  const groups = [
    { title: "Pharmacy Details", iconName: "hospital", fields: [
      { k: "pharmacyName", l: "Pharmacy / Shop Name" },
      { k: "licenseNo", l: "Drug License No." },
      { k: "drugLicense", l: "Drug License (20B)" },
      { k: "registeredSince", l: "Registered Since" },
      { k: "gstin", l: "GSTIN" },
    ]},
    { title: "Owner Information", iconName: "user", fields: [
      { k: "ownerName", l: "Owner Name" },
      { k: "phone", l: "Phone Number" },
      { k: "email", l: "Email Address" },
    ]},
    { title: "Location", iconName: "mappin", fields: [
      { k: "address", l: "Full Address", textarea: true },
    ]},
  ];

  const display = editing ? form : profile;
  const avatar = display.avatar || shopInitials(display.pharmacyName);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHdr
        tag="Settings"
        title="Pharmacy Profile"
        sub="View and update your pharmacy details anytime"
        actions={editing ? [
          <Btn key="c" variant="ghost" onClick={() => { setForm({ ...profile }); setEditing(false); }}>Cancel</Btn>,
          <Btn key="s" variant="primary" onClick={handleSave}>Save Changes</Btn>,
        ] : [
          <Btn key="e" variant="purple" icon="edit" onClick={() => setEditing(true)}>Edit Profile</Btn>,
        ]}
      />
      <div style={{ background: "linear-gradient(135deg,rgba(0,184,141,0.06),rgba(108,99,255,0.06))", border: `1px solid rgba(0,184,141,0.12)`, borderRadius: 18, padding: 26, marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: 16, background: "linear-gradient(135deg,var(--primary),var(--slate))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#ffffff", flexShrink: 0, fontFamily: "'Inter',sans-serif" }}>{avatar}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>{display.pharmacyName || "Your Pharmacy"}</p>
          <p style={{ color: C.muted, margin: "3px 0 0", fontSize: 13 }}>{display.ownerName || "—"} · {display.phone || "No phone"}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <Icon name="mappin" size={11} color={C.dim} />
            <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>{display.address || "Add your address in Edit Profile"}</p>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Est.</p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 800, color: C.teal, margin: 0 }}>{display.registeredSince || "—"}</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {groups.map((g) => (
          <Card key={g.title} style={g.fields.some((f) => f.textarea) ? { gridColumn: "1/-1" } : {}}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: C.surfaceHover, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={g.iconName} size={15} color={C.teal} />
              </div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{g.title}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: g.fields.some((f) => f.textarea) ? "1fr" : g.fields.length > 2 ? "1fr 1fr" : "1fr", gap: 14 }}>
              {g.fields.map((f) => editing
                ? (f.textarea
                  ? <FTextarea key={f.k} label={f.l} value={form[f.k] || ""} onChange={(e) => setF(f.k, e.target.value)} />
                  : <FInput key={f.k} label={f.l} value={form[f.k] || ""} onChange={(e) => setF(f.k, e.target.value)} />)
                : (<div key={f.k}><p style={{ fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>{f.l}</p><p style={{ color: C.text, fontSize: 13, fontWeight: 500, margin: 0 }}>{profile[f.k] || "—"}</p></div>)
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
