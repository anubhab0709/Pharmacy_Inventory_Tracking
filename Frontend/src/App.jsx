import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { C } from "./theme";
import notify from "./utils/notify";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";
import NotificationBell from "./components/NotificationBell";
import { Icon } from "./components/SharedUI";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import AddMedicine from "./pages/AddMedicine";
import EditMedicine from "./pages/EditMedicine";
import ExpiryTracker from "./pages/ExpiryTracker";
import StockTracker from "./pages/StockTracker";
import ExpiredMedicines from "./pages/ExpiredMedicines";
import MakeBill from "./pages/MakeBill";
import PointOfSale from "./pages/PointOfSale";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import { getMedicines, addMedicine, updateMedicine, deleteMedicine, getDisposals, addDisposal, deleteDisposal, getBills, createBill, getProfile, updateProfile } from "./api/medicinesApi";

const MOBILE_MQ = "(max-width: 768px)";

function AppLayout() {
  const { user, canWrite, isAdmin } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [bills, setBills] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const sameId = (a, b) => String(a ?? "") === String(b ?? "") && String(a ?? "") !== "";

  const loadData = async () => {
    try {
      const [m, d, b, p] = await Promise.all([getMedicines(), getDisposals(), getBills(), getProfile()]);
      setMedicines(m);
      setDisposals(d);
      setBills(b);
      setProfile(p);
    } catch (err) {
      console.error("Load error:", err);
      notify.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Soft-refresh from server whenever the user opens the dashboard
  useEffect(() => {
    if (location.pathname !== "/") return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [m, d, b, p] = await Promise.all([getMedicines(), getDisposals(), getBills(), getProfile()]);
        if (cancelled) return;
        setMedicines(Array.isArray(m) ? m : []);
        setDisposals(Array.isArray(d) ? d : []);
        setBills(Array.isArray(b) ? b : []);
        setProfile(p || {});
      } catch (err) {
        if (!cancelled) console.error("Dashboard refresh error:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  const addOrUpdateMedicine = async (med) => {
    if (med.id || med._id) {
      const id = String(med.id || med._id);
      const { id: _i, _id, __v, createdAt, updatedAt, dateAdded, ownerId, ...updates } = med;
      const updated = await updateMedicine(id, updates);
      setMedicines((prev) => {
        let found = false;
        const next = prev.map((m) => {
          if (sameId(m._id || m.id, id)) {
            found = true;
            return updated;
          }
          return m;
        });
        return found ? next : [...prev, updated];
      });
      return updated;
    } else {
      const added = await addMedicine(med);
      setMedicines((prev) => [...prev, added]);
      return added;
    }
  };

  const addMedicineOnly = async (med) => addOrUpdateMedicine(med);

  const deleteMed = async (id) => {
    const target = String(id);
    await deleteMedicine(target);
    setMedicines((prev) => prev.filter((m) => !sameId(m._id || m.id, target)));
  };

  const addDisposalRecord = async (data) => {
    const disposal = await addDisposal(data);
    setDisposals((prev) => [disposal, ...prev]);
    setMedicines((prev) =>
      prev.map((m) =>
        sameId(m._id || m.id, data.medicineId)
          ? { ...m, quantity: Math.max(0, (m.quantity || 0) - (data.quantity || 0)) }
          : m
      )
    );
  };

  const deleteDisposalRecord = async (id) => {
    const target = String(id);
    await deleteDisposal(target);
    setDisposals((prev) => prev.filter((d) => !sameId(d._id || d.id, target)));
  };

  const addBill = async (data) => {
    const bill = await createBill(data);
    await loadData();
    return bill;
  };

  const handleUpdateProfile = async (data) => {
    const p = await updateProfile(data);
    setProfile(p);
  };

  if (loading) {
    return <LoadingScreen message="Loading Pharmacare..." />;
  }

  const sidebarCollapsed = isMobile ? false : isNavCollapsed;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--text);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes navCollapse{from{opacity:0.6}to{opacity:1}}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:6px}
        input,select,textarea{color-scheme:light}
      `}</style>
      <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        {isMobile && mobileNavOpen && (
          <div
            role="presentation"
            onClick={() => setMobileNavOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1190, backdropFilter: "blur(2px)" }}
          />
        )}
        <div
          style={isMobile ? {
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 1200,
            transform: mobileNavOpen ? "translateX(0)" : "translateX(-105%)",
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: mobileNavOpen ? "8px 0 28px rgba(0,0,0,0.18)" : "none",
          } : {
            height: "100%",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Sidebar
            profile={profile}
            medicines={medicines}
            user={user}
            collapsed={sidebarCollapsed}
            onToggleCollapse={isMobile ? () => setMobileNavOpen(false) : () => setIsNavCollapsed((c) => !c)}
            onNavigate={isMobile ? () => setMobileNavOpen(false) : undefined}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0 }}>
          <header style={{ height: 68, borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 14px" : "0 32px", flexShrink: 0, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isMobile && (
                <button
                  type="button"
                  aria-label="Open menu"
                  onClick={() => setMobileNavOpen(true)}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
                    background: C.surfaceHover, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Icon name="menu" size={18} color={C.text} />
                </button>
              )}
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: isMobile ? 16 : 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Workspace Overview</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
              <NotificationBell medicines={medicines} />
              <button onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 12, background: "transparent", border: "none", cursor: "pointer", padding: "4px", transition: "opacity 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}>
              {!isMobile && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{profile.pharmacyName || "Pharmacy Profile"}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.muted, margin: 0 }}>{user?.name || profile.ownerName || "Staff"}</p>
                </div>
              )}
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,var(--primary),var(--slate))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#ffffff", fontFamily: "'Inter',sans-serif", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                {profile.avatar || user?.name?.slice(0, 2)?.toUpperCase() || "RX"}
              </div>
            </button>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 12px 16px" : "16px 20px 20px", width: "100%", boxSizing: "border-box" }}>
            <Routes>
              <Route path="/" element={<Dashboard medicines={medicines} disposals={disposals} navigate={navigate} />} />
              <Route path="/medicines" element={<Medicines medicines={medicines} deleteMed={deleteMed} toast={notify} canWrite={canWrite} isAdmin={isAdmin} onMedicinesRefresh={loadData} />} />
              <Route path="/add-medicine" element={<AddMedicine onAdd={addOrUpdateMedicine} />} />
              <Route path="/edit-medicine/:id" element={<EditMedicine onUpdate={addOrUpdateMedicine} />} />
              <Route path="/expiry-tracker" element={<ExpiryTracker medicines={medicines} />} />
              <Route path="/stock-tracker" element={<StockTracker medicines={medicines} addOrUpdateMedicine={addOrUpdateMedicine} addMedicine={addMedicineOnly} toast={notify} canWrite={canWrite} />} />
              <Route path="/expired-medicines" element={<ExpiredMedicines medicines={medicines} disposals={disposals} profile={profile} addDisposal={addDisposalRecord} deleteDisposal={deleteDisposalRecord} toast={notify} canWrite={canWrite} isAdmin={isAdmin} />} />
              <Route path="/make-bill" element={<MakeBill medicines={medicines} bills={bills} profile={profile} createBill={addBill} toast={notify} canWrite={canWrite} />} />
              <Route path="/pos" element={<PointOfSale medicines={medicines} profile={profile} createBill={addBill} toast={notify} />} />
              <Route path="/profile" element={<Profile profile={profile} updateProfileApi={handleUpdateProfile} toast={notify} />} />
              <Route path="/contact-us" element={<ContactUs />} />
            </Routes>
          </main>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar theme="colored" />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}
