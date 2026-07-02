import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { C } from "./theme";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import ExpiryTracker from "./pages/ExpiryTracker";
import StockTracker from "./pages/StockTracker";
import StockOut from "./pages/StockOut";
import MakeBill from "./pages/MakeBill";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import { getMedicines, addMedicine, updateMedicine, deleteMedicine, getStockOuts, addStockOut, deleteStockOut, getBills, createBill, getProfile, updateProfile } from "./api/medicinesApi";

function AppLayout() {
  const { user, canWrite, isAdmin } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [stockOuts, setStockOuts] = useState([]);
  const [bills, setBills] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [m, s, b, p] = await Promise.all([getMedicines(), getStockOuts(), getBills(), getProfile()]);
      setMedicines(m);
      setStockOuts(s);
      setBills(b);
      setProfile(p);
    } catch (err) {
      console.error("Load error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateMedicine = async (med) => {
    if (med.id || med._id) {
      const updated = await updateMedicine(med.id || med._id, med);
      setMedicines((prev) => prev.map((m) => ((m._id || m.id) === (updated._id || updated.id) ? updated : m)));
    } else {
      const added = await addMedicine(med);
      setMedicines((prev) => [...prev, added]);
    }
  };

  const deleteMed = async (id) => {
    await deleteMedicine(id);
    setMedicines((prev) => prev.filter((m) => m._id !== id && m.id !== id));
  };

  const addDispense = async (data) => {
    const stockOut = await addStockOut(data);
    setStockOuts((prev) => [stockOut, ...prev]);
    setMedicines((prev) => prev.map((m) => ((m._id || m.id) === data.medicineId ? { ...m, quantity: m.quantity - data.quantity } : m)));
  };

  const addBill = async (data) => {
    const bill = await createBill(data);
    await loadData();
    return bill;
  };

  const deleteDispense = async (id) => {
    await deleteStockOut(id);
    setStockOuts((prev) => prev.filter((s) => s._id !== id && s.id !== id));
  };

  const handleUpdateProfile = async (data) => {
    const p = await updateProfile(data);
    setProfile(p);
  };

  if (loading) {
    return <LoadingScreen message="Loading Pharmacare..." />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--text);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:6px}
        input,select,textarea{color-scheme:light}
      `}</style>
      <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        <Sidebar profile={profile} medicines={medicines} user={user} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <header style={{ height: 68, borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>Workspace Overview</p>
            <button onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", padding: "4px", transition: "opacity 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{profile.pharmacyName || "Pharmacy Profile"}</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.muted, margin: 0 }}>{user?.name || profile.ownerName || "Staff"}</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,var(--primary),var(--slate))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#ffffff", fontFamily: "'Inter',sans-serif", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                {profile.avatar || user?.name?.slice(0, 2)?.toUpperCase() || "RX"}
              </div>
            </button>
          </header>

          <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", paddingBottom: 40 }}>
            <Routes>
              <Route path="/" element={<Dashboard medicines={medicines} stockOuts={stockOuts} navigate={navigate} />} />
              <Route path="/medicines" element={<Medicines medicines={medicines} addOrUpdateMedicine={addOrUpdateMedicine} deleteMed={deleteMed} toast={toast} canWrite={canWrite} isAdmin={isAdmin} />} />
              <Route path="/add-medicine" element={<Medicines medicines={medicines} addOrUpdateMedicine={addOrUpdateMedicine} deleteMed={deleteMed} toast={toast} canWrite={canWrite} isAdmin={isAdmin} openAddOnLoad />} />
              <Route path="/expiry-tracker" element={<ExpiryTracker medicines={medicines} />} />
              <Route path="/stock-tracker" element={<StockTracker medicines={medicines} addOrUpdateMedicine={addOrUpdateMedicine} toast={toast} canWrite={canWrite} />} />
              <Route path="/stock-out" element={<StockOut medicines={medicines} stockOuts={stockOuts} profile={profile} addDispense={addDispense} deleteDispense={deleteDispense} toast={toast} canWrite={canWrite} isAdmin={isAdmin} />} />
              <Route path="/make-bill" element={<MakeBill medicines={medicines} bills={bills} profile={profile} createBill={addBill} toast={toast} canWrite={canWrite} />} />
              <Route path="/profile" element={<Profile profile={profile} updateProfileApi={handleUpdateProfile} toast={toast} />} />
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
