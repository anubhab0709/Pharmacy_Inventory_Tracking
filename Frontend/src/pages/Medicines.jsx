import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { C, CATEGORIES } from "../theme";
import { exportCSV, getExpiryStatus, getStockStatus, fmtCurrency, fmtDate } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, SearchBar, Badge, inputSt, selectSt } from "../components/SharedUI";
import { bulkUpdateTaxes } from "../api/medicinesApi";
import { useNavigate } from "react-router-dom";

const compactSelect = { ...selectSt, padding: "7px 10px", fontSize: 12, minHeight: 34 };
const PAGE_SIZE = 50;

export default function Medicines({ medicines = [], deleteMed, toast, canWrite = true, isAdmin = false, onMedicinesRefresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [deleteId, setDeleteId] = useState(null);
  const [viewMed, setViewMed] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxForm, setTaxForm] = useState({ cgst: "", sgst: "", hsnCode: "" });
  const [savingTax, setSavingTax] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);

  const categoryOptions = useMemo(() => {
    const fromData = medicines.map((m) => m.category).filter(Boolean);
    return [...new Set([...CATEGORIES, ...fromData])].sort();
  }, [medicines]);

  const filtered = medicines
    .filter(m => catFilter === "All" || m.category === catFilter)
    .filter(m => (m.name || "").toLowerCase().includes(search.toLowerCase()) || (m.manufacturer || "").toLowerCase().includes(search.toLowerCase()) || (m.batchNo || m.batchNumber || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "name" ? (a.name || "").localeCompare(b.name || "") : sortBy === "qty" ? a.quantity - b.quantity : new Date(a.expiryDate) - new Date(b.expiryDate));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  useEffect(() => { setPage(1); }, [search, catFilter, sortBy]);

  const selectedCount = selectedIds.length;

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
      return;
    }
    setSelectedIds(filtered.map(m => m._id || m.id).filter(Boolean));
    setSelectAll(true);
  };

  const handleBulkDelete = async () => {
    if (!selectedCount) return;
    try {
      await Promise.all(selectedIds.map(id => deleteMed(id)));
      toast(`${selectedCount} medicine${selectedCount === 1 ? "" : "s"} deleted`, "warning");
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMed(deleteId);
      toast("Medicine deleted", "warning");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkTaxSave = async () => {
    const cgst = Number(taxForm.cgst);
    const sgst = Number(taxForm.sgst);
    if (taxForm.cgst === "" && taxForm.sgst === "" && !taxForm.hsnCode) {
      toast("Enter at least one tax field", "error");
      return;
    }
    if ((taxForm.cgst !== "" && (isNaN(cgst) || cgst < 0)) || (taxForm.sgst !== "" && (isNaN(sgst) || sgst < 0))) {
      toast("CGST and SGST must be valid percentages", "error");
      return;
    }
    try {
      setSavingTax(true);
      const payload = {};
      if (taxForm.cgst !== "") payload.cgst = cgst;
      if (taxForm.sgst !== "") payload.sgst = sgst;
      if (taxForm.hsnCode) payload.hsnCode = taxForm.hsnCode;
      await bulkUpdateTaxes(payload);
      if (onMedicinesRefresh) await onMedicinesRefresh();
      toast(`Taxes updated on all ${medicines.length} medicines`);
      setShowTaxModal(false);
      setTaxForm({ cgst: "", sgst: "", hsnCode: "" });
    } catch (err) {
      toast(err.message || "Failed to update taxes", "error");
    } finally {
      setSavingTax(false);
    }
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", display: "flex", flexDirection: "column", height: "calc(100vh - 96px)", minHeight: 420, width: "100%" }}>
      <PageHdr compact tag="Inventory" title="Medicines" sub={`${medicines.length} medicines in database`}
        actions={[
          selectedCount > 0 && canWrite ? <Btn key="bulk" variant="danger" icon="trash" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete {selectedCount}</Btn> : null,
          <Btn key="exp" variant="ghost" icon="download" size="sm" onClick={() => exportCSV({
            rows: filtered.map(medicine => ({
              name: medicine.name,
              manufacturer: medicine.manufacturer,
              batchNo: medicine.batchNo || medicine.batchNumber,
              category: medicine.category,
              stock: medicine.quantity,
              unit: medicine.unit || "Tablets",
              threshold: medicine.threshold || 0,
              price: fmtCurrency(medicine.price),
              cgst: medicine.cgst ?? 0,
              sgst: medicine.sgst ?? 0,
              hsnCode: medicine.hsnCode || "",
              expiryDate: fmtDate(medicine.expiryDate),
              expiryStatus: getExpiryStatus(medicine.expiryDate).label,
              stockStatus: getStockStatus(medicine.quantity, medicine.threshold || 0).label,
            })),
            columns: [
              { label: "Medicine", key: "name" },
              { label: "Manufacturer", key: "manufacturer" },
              { label: "Batch No", key: "batchNo" },
              { label: "Category", key: "category" },
              { label: "Stock", key: "stock" },
              { label: "Unit", key: "unit" },
              { label: "Threshold", key: "threshold" },
              { label: "Price", key: "price" },
              { label: "CGST %", key: "cgst" },
              { label: "SGST %", key: "sgst" },
              { label: "HSN", key: "hsnCode" },
              { label: "Expiry Date", key: "expiryDate" },
              { label: "Expiry Status", key: "expiryStatus" },
              { label: "Stock Status", key: "stockStatus" },
            ],
            filename: "medicines.csv",
          })}>Export</Btn>,
          ...(canWrite ? [
            <Btn key="add" variant="secondary" icon="plus" onClick={() => navigate("/add-medicine")}>Add Medicine</Btn>,
            <Btn key="tax" variant="green" icon="receipt" onClick={() => setShowTaxModal(true)}>Edit Taxes on All Medicines</Btn>
          ] : []),
        ]}
      />

      <Card style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, padding: "12px 14px 12px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 10, flexShrink: 0, width: "100%" }}>
          <div style={{ flex: "1 1 280px", minWidth: 200, maxWidth: "none" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, batch..." compact />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: "auto" }}>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...compactSelect, width: "auto", minWidth: 140 }}>
              <option value="All">All Categories</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...compactSelect, width: "auto", minWidth: 120 }}>
              <option value="name">Sort: Name</option>
              <option value="qty">Sort: Stock</option>
              <option value="expiry">Sort: Expiry</option>
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", minHeight: 0, width: "100%" }}>
          <Table
            compact
            cols={[
              { key: "select", width: "4%", label: "Select", header: <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ width: 15, height: 15 }} />, render: r => {
                const id = r._id || r.id;
                return <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelect(id)} style={{ width: 15, height: 15 }} />;
              }},
              { key: "medicine", width: "22%", label: "Medicine", render: r => <div><p style={{ color: C.text, fontWeight: 600, margin: 0, fontSize: 13 }}>{r.name}</p><p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{r.manufacturer} · {r.batchNo || r.batchNumber}</p></div> },
              { key: "category", width: "12%", label: "Category", render: r => <span style={{ color: C.purple, fontSize: 12, fontWeight: 600 }}>{r.category}</span> },
              { key: "stock", width: "12%", label: "Stock", render: r => { const s = getStockStatus(r.quantity, r.threshold || 0); return <div><p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 13 }}>{r.quantity} {r.unit || "Tablets"}</p><Badge {...s} /></div>; } },
              { key: "price", width: "9%", label: "Price", render: r => <span style={{ color: C.teal, fontWeight: 600 }}>{fmtCurrency(r.price)}</span> },
              { key: "tax", width: "12%", label: "Tax", render: r => <span style={{ color: C.muted, fontSize: 11 }}>{(r.cgst || r.sgst) ? `CGST ${r.cgst || 0}% · SGST ${r.sgst || 0}%` : "—"}</span> },
              { key: "expiry", width: "12%", label: "Expiry", render: r => { const s = getExpiryStatus(r.expiryDate); return <div><p style={{ color: C.text, margin: "0 0 2px", fontSize: 12 }}>{fmtDate(r.expiryDate)}</p><Badge {...s} /></div>; } },
              { key: "actions", width: "17%", label: "Actions", render: r => <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", justifyContent: "flex-start" }}>
                <Btn variant="secondary" size="sm" icon="eye" onClick={() => setViewMed(r)}>View</Btn>
                {canWrite && <Btn variant="blue" size="sm" icon="edit" onClick={() => navigate(`/edit-medicine/${r.id || r._id}`)}>Edit</Btn>}
                {isAdmin && <Btn variant="danger" size="sm" icon="trash" onClick={() => setDeleteId(r.id || r._id)}>Delete</Btn>}
              </div> },
            ]}
            rows={pageRows}
            emptyMsg="No medicines match your search"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", flexShrink: 0, paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
          <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>
            Showing {rangeStart}–{rangeEnd} of {filtered.length}{filtered.length !== medicines.length ? ` (filtered from ${medicines.length})` : ""}
          </p>
          {filtered.length > PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Btn variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Btn>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Page {safePage} / {totalPages}</span>
              <Btn variant="secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Btn>
            </div>
          )}
        </div>
      </Card>

      <ConfirmModal open={!!deleteId} title="Delete Medicine" message="This will permanently remove this medicine from your inventory. This action cannot be undone." onConfirm={handleConfirmDelete} onCancel={() => setDeleteId(null)} />
      <ConfirmModal open={bulkDeleteOpen} title="Delete Selected Medicines" message={`This will permanently delete ${selectedCount} selected medicine${selectedCount === 1 ? "" : "s"}. This cannot be undone.`} onConfirm={async () => { setBulkDeleteOpen(false); await handleBulkDelete(); }} onCancel={() => setBulkDeleteOpen(false)} confirmLabel="Delete All" />

      {showTaxModal && createPortal(
        <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", zIndex: 1100, padding: 24 }}>
          <div style={{ width: 440, background: C.surface, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease" }}>
            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Edit Taxes on All Medicines</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Apply CGST, SGST & HSN to all {medicines.length} medicines</p>
              </div>
              <button onClick={() => setShowTaxModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceHover, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="CGST (%)">
                <input type="number" min="0" max="100" step="0.01" value={taxForm.cgst} onChange={e => setTaxForm(p => ({ ...p, cgst: e.target.value }))} placeholder="e.g. 6" style={inputSt()} />
              </Field>
              <Field label="SGST (%)">
                <input type="number" min="0" max="100" step="0.01" value={taxForm.sgst} onChange={e => setTaxForm(p => ({ ...p, sgst: e.target.value }))} placeholder="e.g. 6" style={inputSt()} />
              </Field>
              <Field label="HSN Code (optional)">
                <input type="text" value={taxForm.hsnCode} onChange={e => setTaxForm(p => ({ ...p, hsnCode: e.target.value }))} placeholder="e.g. 3004" style={inputSt()} />
              </Field>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Leave a field blank to keep existing values. Individual medicines can also be edited via Edit Details.</p>
            </div>
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn variant="danger" onClick={() => setShowTaxModal(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleBulkTaxSave} disabled={savingTax}>{savingTax ? "Saving..." : "Apply to All"}</Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewMed && (
        <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", zIndex: 1100, padding: 24, animation: "fadeUp 0.2s ease" }}>
          <div style={{ width: 450, background: C.surface, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Medicine Details</h3>
              <button onClick={() => setViewMed(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceHover, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Name", viewMed.name],
                ["Category", viewMed.category, C.purple],
                ["Manufacturer", viewMed.manufacturer || "N/A"],
                ["Batch Number", viewMed.batchNumber || viewMed.batchNo || "N/A"],
                ["Price", fmtCurrency(viewMed.price), C.teal],
                ["Stock", viewMed.quantity],
                ["Threshold", viewMed.threshold || 20],
                ["CGST", `${viewMed.cgst ?? 0}%`],
                ["SGST", `${viewMed.sgst ?? 0}%`],
                ["HSN Code", viewMed.hsnCode || "N/A"],
                ["Expiry Date", fmtDate(viewMed.expiryDate)],
                ["Barcode", viewMed.barcode || "N/A"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: label === "Barcode" ? "none" : `1px dashed ${C.border}` }}>
                  <span style={{ color: C.muted, fontSize: 14 }}>{label}:</span>
                  <strong style={{ color: color || C.text, fontSize: 14 }}>{val}</strong>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {canWrite && <Btn variant="blue" icon="edit" onClick={() => { setViewMed(null); navigate(`/edit-medicine/${viewMed.id || viewMed._id}`); }}>Edit</Btn>}
              <Btn variant="danger" onClick={() => setViewMed(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
