import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { C } from "../theme";
import { getStockStatus, getDaysToExpiry, fmtDate, fmtCurrency } from "../utils";
import { Btn, Card, PageHdr, StatCard, SearchBar, Badge, Field, Icon, inputSt, selectSt } from "../components/SharedUI";

const FILTER_MAP = {
  all: "All",
  low: "Low",
  in_stock: "In Stock",
  instock: "In Stock",
  "in-stock": "In Stock",
};

const resolveFilter = (value) => FILTER_MAP[String(value || "all").toLowerCase()] || "All";

function groupKey(m) {
  return (m.name || "").trim().toLowerCase();
}

function buildGroups(medicines) {
  const map = new Map();
  medicines.forEach((m) => {
    const key = groupKey(m);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  });

  return Array.from(map.entries()).map(([key, batches]) => {
    const sorted = [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const totalQty = sorted.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
    const threshold = Math.max(...sorted.map((b) => b.threshold || 10));
    const stockValue = sorted.reduce((s, b) => s + (Number(b.quantity) || 0) * (Number(b.price) || 0), 0);
    const nearestExpiry = sorted[0]?.expiryDate;
    const primary = sorted[0];
    return {
      key,
      name: primary.name,
      category: primary.category,
      unit: primary.unit || "Tablets",
      batches: sorted,
      batchCount: sorted.length,
      totalQty,
      threshold,
      stockValue,
      nearestExpiry,
      primary,
    };
  });
}

export default function StockTracker({ medicines = [], addOrUpdateMedicine, addMedicine, toast, canWrite = true }) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(() => resolveFilter(searchParams.get("filter")));
  const [expanded, setExpanded] = useState({});
  const [restockGroup, setRestockGroup] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [newBatch, setNewBatch] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [focusRQ, setFocusRQ] = useState(false);

  useEffect(() => {
    setFilter(resolveFilter(searchParams.get("filter")));
  }, [searchParams]);

  const groups = useMemo(() => buildGroups(medicines), [medicines]);

  const filtered = useMemo(() => {
    return groups
      .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
      .filter((g) => {
        if (filter === "All") return true;
        const s = getStockStatus(g.totalQty, g.threshold).label;
        return filter === "Low"
          ? ["Critical Low", "Low Stock", "Out of Stock"].includes(s)
          : s === "In Stock";
      })
      .sort((a, b) => (a.totalQty / Math.max(a.threshold, 1)) - (b.totalQty / Math.max(b.threshold, 1)));
  }, [groups, search, filter]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openRestock = (group) => {
    const firstId = String(group.batches[0]?._id || group.batches[0]?.id || "");
    setRestockGroup(group);
    setSelectedBatchId(firstId);
    setRestockQty("");
    setNewBatch(false);
    setNewBatchNo("");
    setNewExpiry("");
  };

  const resetRestockModal = () => {
    setRestockGroup(null);
    setSelectedBatchId("");
    setRestockQty("");
    setNewBatch(false);
    setNewBatchNo("");
    setNewExpiry("");
  };

  const selectedBatch = restockGroup?.batches.find(
    (b) => String(b._id || b.id) === String(selectedBatchId)
  ) || restockGroup?.batches[0];

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) { toast("Enter a valid quantity", "error"); return; }
    if (!restockGroup) return;

    const template = selectedBatch || restockGroup.primary;

    if (newBatch) {
      if (!newBatchNo.trim()) { toast("Enter batch number for new stock", "error"); return; }
      if (!newExpiry) { toast("Enter expiry date for new stock", "error"); return; }
      try {
        await addMedicine({
          name: restockGroup.name,
          category: template.category || restockGroup.category,
          manufacturer: template.manufacturer,
          price: template.price,
          threshold: template.threshold || restockGroup.threshold || 20,
          unit: restockGroup.unit || "Tablets",
          quantity: qty,
          batchNumber: newBatchNo.trim(),
          batchNo: newBatchNo.trim(),
          expiryDate: newExpiry,
          barcode: template.barcode || "",
          cgst: template.cgst ?? 0,
          sgst: template.sgst ?? 0,
          hsnCode: template.hsnCode || "",
        });
        toast(`Added ${qty} units as new batch for ${restockGroup.name}`);
        setExpanded((prev) => ({ ...prev, [restockGroup.key]: true }));
        resetRestockModal();
      } catch (err) {
        toast("Failed to add new batch: " + err.message, "error");
      }
      return;
    }

    if (!selectedBatch) {
      toast("Select a batch to restock", "error");
      return;
    }

    try {
      const medId = selectedBatch._id || selectedBatch.id;
      await addOrUpdateMedicine({
        id: medId,
        _id: medId,
        quantity: selectedBatch.quantity + qty,
      });
      toast(`Added ${qty} units to batch ${selectedBatch.batchNumber || selectedBatch.batchNo || medId}`);
      resetRestockModal();
    } catch (err) {
      toast("Failed to restock: " + err.message, "error");
    }
  };

  const uniqueNames = groups.length;
  const oos = groups.filter((g) => g.totalQty === 0).length;
  const low = groups.filter((g) => g.totalQty > 0 && g.totalQty <= g.threshold).length;
  const tv = groups.reduce((s, g) => s + g.stockValue, 0);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHdr tag="Inventory" title="Stock Tracker" sub="Monitor and manage medicine stock levels · batches roll up into total stock" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard title="Total SKUs" value={uniqueNames} sub={`${medicines.length} batches`} accent={C.teal} iconName="list" delay={0} />
        <StatCard title="Out of Stock" value={oos} sub="Immediate action" accent={C.red} iconName="ban" delay={0.05} />
        <StatCard title="Low Stock" value={low} sub="Below threshold" accent={C.orange} iconName="warning" delay={0.1} />
        <StatCard title="Stock Value" value={fmtCurrency(tv)} sub="Inventory worth" accent={C.purple} iconName="coins" delay={0.15} />
      </div>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search medicines..." />
          {["All", "Low", "In Stock"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: `1px solid ${filter === f ? C.teal : C.border}`,
                background: filter === f ? "rgba(var(--primary-rgb),0.08)" : "transparent",
                color: filter === f ? C.teal : C.muted,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (filter !== f) e.currentTarget.style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { if (filter !== f) e.currentTarget.style.background = "transparent"; }}
            >
              {f === "Low" ? "Low / Critical" : f}
            </button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Medicine", "Total Stock", "Batches", "Stock Value", "Nearest Expiry", "Action"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: C.muted, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: C.dim, fontSize: 14 }}>No medicines match your search</td>
                </tr>
              )}
              {filtered.map((g) => {
                const isOpen = !!expanded[g.key];
                const s = getStockStatus(g.totalQty, g.threshold);
                const pct = Math.min(100, Math.round((g.totalQty / Math.max(g.threshold * 2, 1)) * 100));
                return (
                  <React.Fragment key={g.key}>
                    <tr style={{ borderBottom: isOpen ? "none" : `1px solid ${C.border}`, background: isOpen ? "rgba(var(--primary-rgb),0.03)" : "transparent" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(g.key)}
                          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}
                        >
                          <span style={{
                            width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            background: C.surface, color: C.muted, fontSize: 12, fontWeight: 700,
                            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}>›</span>
                          <div>
                            <p style={{ color: C.text, fontWeight: 600, margin: 0 }}>{g.name}</p>
                            <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{g.category} · {g.unit}</p>
                          </div>
                        </button>
                      </td>
                      <td style={{ padding: "14px 16px", minWidth: 180 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{g.totalQty} total</span>
                          <Badge {...s} />
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: C.border }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: s.color, transition: "width 0.6s ease" }} />
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Min threshold: {g.threshold}</p>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: g.batchCount > 1 ? "rgba(var(--primary-rgb),0.1)" : C.surfaceHover,
                          color: g.batchCount > 1 ? C.teal : C.muted,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {g.batchCount} batch{g.batchCount === 1 ? "" : "es"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: C.muted, fontWeight: 600 }}>{fmtCurrency(g.stockValue)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: getDaysToExpiry(g.nearestExpiry) < 90 ? C.orange : C.muted, fontSize: 12 }}>{fmtDate(g.nearestExpiry)}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {canWrite ? (
                          <Btn variant="blue" size="sm" icon="refresh" onClick={() => openRestock(g)}>Restock</Btn>
                        ) : (
                          <span style={{ color: C.dim, fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>

                    {isOpen && g.batches.map((b, i) => {
                      const bs = getStockStatus(b.quantity, b.threshold || 10);
                      return (
                        <tr key={b._id || b.id} style={{ borderBottom: i === g.batches.length - 1 ? `1px solid ${C.border}` : `1px dashed ${C.border}`, background: "rgba(15,23,42,0.02)" }}>
                          <td style={{ padding: "10px 16px 10px 48px" }}>
                            <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 500 }}>
                              Batch: <span style={{ color: C.teal }}>{b.batchNumber || b.batchNo || "—"}</span>
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{fmtCurrency(b.price)} / unit</p>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{b.quantity}</span>
                            <span style={{ marginLeft: 8 }}><Badge {...bs} /></span>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.muted }}>Batch {i + 1} of {g.batchCount}</td>
                          <td style={{ padding: "10px 16px", color: C.muted, fontSize: 13 }}>{fmtCurrency((b.quantity || 0) * (b.price || 0))}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ color: getDaysToExpiry(b.expiryDate) < 90 ? C.orange : C.muted, fontSize: 12 }}>{fmtDate(b.expiryDate)}</span>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.dim }}>—</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: C.dim, fontSize: 12, marginTop: 12, textAlign: "right" }}>
          Showing {filtered.length} medicine{filtered.length === 1 ? "" : "s"} · click a row to see batches
        </p>
      </Card>

      {restockGroup && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div role="dialog" aria-modal="true" aria-labelledby="restock-modal-title" style={{ width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "hidden", borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", display: "flex", flexDirection: "column", animation: "fadeUp 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: `1px solid ${C.border}`, padding: "20px 24px", flexShrink: 0 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, color: C.teal }}>Inventory</p>
                <h2 id="restock-modal-title" style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>Restock Medicine</h2>
              </div>
              <button onClick={resetRestockModal} aria-label="Close modal" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="close" size={16} color={C.muted} /></button>
            </div>

            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              <div style={{ background: "rgba(0,184,141,0.05)", border: "1px solid rgba(0,184,141,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
                <p style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 700 }}>{restockGroup.name}</p>
                <p style={{ margin: "6px 0 0", color: C.text, fontSize: 13, fontWeight: 600 }}>
                  Combined total: <span style={{ color: C.teal }}>{restockGroup.totalQty} {restockGroup.unit}</span>
                  {" · "}{restockGroup.batchCount} batch{restockGroup.batchCount === 1 ? "" : "es"}
                </p>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer", fontSize: 14, color: C.text }}>
                <input type="checkbox" checked={newBatch} onChange={(e) => setNewBatch(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span>New batch with different expiry date</span>
              </label>

              {!newBatch && (
                <div style={{ marginBottom: 14 }}>
                  <Field label="Select Existing Batch" required>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      style={selectSt}
                    >
                      {restockGroup.batches.map((b) => {
                        const id = String(b._id || b.id);
                        const batchLabel = b.batchNumber || b.batchNo || "No batch #";
                        return (
                          <option key={id} value={id} style={{ background: C.surface }}>
                            {batchLabel} · Exp: {fmtDate(b.expiryDate)} · Stock: {b.quantity} {restockGroup.unit}
                          </option>
                        );
                      })}
                    </select>
                  </Field>
                  {selectedBatch && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: C.muted }}>
                      Selected: <strong style={{ color: C.text }}>{selectedBatch.batchNumber || selectedBatch.batchNo || "—"}</strong>
                      {" · "}Expires <strong style={{ color: getDaysToExpiry(selectedBatch.expiryDate) < 90 ? C.orange : C.text }}>{fmtDate(selectedBatch.expiryDate)}</strong>
                      {" · "}Current stock: <strong style={{ color: C.teal }}>{selectedBatch.quantity}</strong>
                    </p>
                  )}
                </div>
              )}

              <Field label="Quantity to Add" required>
                <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity..." style={inputSt(focusRQ)} onFocus={() => setFocusRQ(true)} onBlur={() => setFocusRQ(false)} />
              </Field>

              {newBatch ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                  <Field label="New Batch Number" required>
                    <input type="text" value={newBatchNo} onChange={(e) => setNewBatchNo(e.target.value)} placeholder="e.g. B2024-001" style={inputSt()} />
                  </Field>
                  <Field label="New Expiry Date" required>
                    <input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} style={inputSt()} />
                  </Field>
                  {restockQty && (
                    <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 13, color: C.muted }}>
                      New combined total: <strong style={{ color: C.teal }}>{restockGroup.totalQty + Number(restockQty || 0)}</strong> (new batch kept separate)
                    </p>
                  )}
                </div>
              ) : (
                restockQty && selectedBatch && (
                  <p style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>
                    Selected batch → <strong style={{ color: C.teal }}>{selectedBatch.quantity + Number(restockQty || 0)}</strong>
                    {" · "}Combined total → <strong style={{ color: C.teal }}>{restockGroup.totalQty + Number(restockQty || 0)}</strong>
                  </p>
                )
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, padding: "16px 24px", flexShrink: 0 }}>
              <Btn variant="danger" onClick={resetRestockModal}>Cancel</Btn>
              <Btn variant="primary" onClick={handleRestock}>{newBatch ? "Add New Batch" : "Confirm Restock"}</Btn>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
