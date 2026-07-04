import React, { useState } from "react";
import { C } from "../theme";
import { exportCSV, fmtDate, getDaysToExpiry } from "../utils";
import { Icon, Btn, Card, PageHdr, Table, ConfirmModal, Field, FTextarea, SearchBar, selectSt } from "../components/SharedUI";

const DISPOSAL_REASONS = ["Expired", "Damaged", "Broken", "Returned to Distributor", "Other"];

export default function ExpiredMedicines({ medicines = [], disposals = [], addDisposal, deleteDisposal, toast, canWrite = true, isAdmin = false, profile = {} }) {
  const emptyForm = { medicineId: "", quantity: "", reason: "", notes: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const selMed = medicines.find(m => (m.id || m._id) === form.medicineId);
  const isExpired = selMed ? getDaysToExpiry(selMed.expiryDate) < 0 : false;
  const daysToExpiry = selMed ? getDaysToExpiry(selMed.expiryDate) : null;

  const validate = () => {
    const e = {};
    if (!form.medicineId) e.medicineId = "Select a medicine";
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) e.quantity = "Enter a valid quantity";
    else if (selMed && Number(form.quantity) > selMed.quantity) e.quantity = `Only ${selMed.quantity} units available`;
    if (!form.reason) e.reason = "Select a disposal reason";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addDisposal({
        medicineId: form.medicineId,
        quantity: Number(form.quantity),
        reason: form.reason,
        notes: form.notes,
        disposedBy: profile.ownerName || "Staff",
      });
      toast(`${form.quantity} units of ${selMed.name} disposed`, "success");
      setForm(emptyForm);
      setErrors({});
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDisposal(deleteId);
      toast("Disposal record deleted", "warning");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = disposals.filter(d =>
    (d.medicineName || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.reason || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.batchNo || "").toLowerCase().includes(search.toLowerCase())
  );

  const reasonColor = (reason) => {
    if (reason === "Expired") return { color: C.red, bg: "#fff1f2" };
    if (reason === "Damaged") return { color: C.orange, bg: "#fff7ed" };
    if (reason === "Broken") return { color: C.yellow, bg: "#fefce8" };
    if (reason === "Returned to Distributor") return { color: C.purple, bg: "#f5f3ff" };
    return { color: C.muted, bg: C.surfaceHover };
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHdr
        tag="Disposal"
        title="Expired Medicines Disposal"
        sub="Safely record and track disposal of expired, damaged, or returned medicines"
        actions={[
          <Btn key="exp" variant="ghost" icon="download" size="sm" onClick={() => exportCSV({
            rows: filtered.map(d => ({
              date: fmtDate(d.createdAt),
              medicine: d.medicineName,
              batchNo: d.batchNo || "—",
              quantity: d.quantity,
              reason: d.reason,
              notes: d.notes || "—",
              disposedBy: d.disposedBy || "Staff",
            })),
            columns: [
              { label: "Date", key: "date" },
              { label: "Medicine", key: "medicine" },
              { label: "Batch No", key: "batchNo" },
              { label: "Quantity", key: "quantity" },
              { label: "Reason", key: "reason" },
              { label: "Notes", key: "notes" },
              { label: "Disposed By", key: "disposedBy" },
            ],
            filename: "disposal-records.csv",
          })}>Export</Btn>
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: canWrite ? "360px 1fr" : "1fr", gap: 22, alignItems: "start" }}>

        {/* ── Left: Disposal Form ── */}
        {canWrite && (
          <Card style={{ position: "sticky", top: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.red}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="trash" size={17} color={C.red} />
              </div>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Dispose Medicine</p>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Record expired or damaged stock</p>
              </div>
            </div>

            <div style={{ height: 1, background: C.border, margin: "14px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Medicine Select */}
              <Field label="Select Medicine" required error={errors.medicineId}>
                <select
                  style={selectSt}
                  value={form.medicineId}
                  onChange={e => setF("medicineId", e.target.value)}
                >
                  <option value="">-- Select Medicine --</option>
                  {medicines.map(m => {
                    const exp = getDaysToExpiry(m.expiryDate);
                    const label = exp < 0
                      ? `⚠ ${m.name} [EXPIRED] (${m.quantity} left)`
                      : exp <= 30
                        ? `! ${m.name} [Exp soon] (${m.quantity} left)`
                        : `${m.name} (${m.quantity} left)`;
                    return <option key={m.id || m._id} value={m.id || m._id} style={{ background: C.surface }}>{label}</option>;
                  })}
                </select>
              </Field>

              {/* Selected medicine info */}
              {selMed && (
                <div style={{ background: isExpired ? "#fff1f212" : `${C.teal}08`, border: `1px solid ${isExpired ? "#fca5a528" : `${C.teal}18`}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { l: "Available", v: `${selMed.quantity} ${selMed.unit || "units"}`, c: C.teal },
                      { l: "Batch No", v: selMed.batchNo || selMed.batchNumber || "—", c: C.text },
                      { l: "Expiry", v: fmtDate(selMed.expiryDate), c: isExpired ? C.red : C.text },
                      { l: "Status", v: isExpired ? "EXPIRED" : daysToExpiry <= 30 ? `${daysToExpiry}d to expiry` : "Valid", c: isExpired ? C.red : daysToExpiry <= 30 ? C.orange : C.teal },
                    ].map(x => (
                      <div key={x.l}>
                        <p style={{ color: C.dim, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{x.l}</p>
                        <p style={{ color: x.c, fontWeight: 700, margin: 0, fontSize: 12 }}>{x.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <Field label="Quantity to Dispose" required error={errors.quantity}>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setF("quantity", e.target.value)}
                  placeholder="Enter quantity"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${errors.quantity ? C.red : C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: "'Inter',sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              </Field>

              {/* Disposal Reason */}
              <Field label="Disposal Reason" required error={errors.reason}>
                <select
                  style={{ ...selectSt, border: `1px solid ${errors.reason ? C.red : C.border}` }}
                  value={form.reason}
                  onChange={e => setF("reason", e.target.value)}
                >
                  <option value="">-- Select reason --</option>
                  {DISPOSAL_REASONS.map(r => (
                    <option key={r} value={r} style={{ background: C.surface }}>{r}</option>
                  ))}
                </select>
              </Field>

              {/* Notes */}
              <FTextarea
                label="Notes (Optional)"
                value={form.notes}
                onChange={e => setF("notes", e.target.value)}
                placeholder="Add any additional context about this disposal..."
                rows={3}
              />

              {/* Submit */}
              <Btn
                variant="danger"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              >
                <Icon name="trash" size={16} color="currentColor" />
                {loading ? "Processing..." : "Dispose Medicine"}
              </Btn>
            </div>
          </Card>
        )}

        {/* ── Right: History Table ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
              Disposal History <span style={{ color: C.muted, fontWeight: 400, fontSize: 14 }}>({disposals.length})</span>
            </p>
          </div>

          <Card style={{ marginBottom: 14 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by medicine, reason, or batch no..." />
          </Card>

          <Card>
            <Table
              cols={[
                {
                  label: "Date",
                  render: r => (
                    <span style={{ color: C.muted, fontSize: 13 }}>{fmtDate(r.createdAt || r.date)}</span>
                  )
                },
                {
                  label: "Medicine",
                  render: r => (
                    <div>
                      <p style={{ color: C.text, fontWeight: 700, margin: 0, fontSize: 13 }}>{r.medicineName}</p>
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Batch: {r.batchNo || "—"}</p>
                    </div>
                  )
                },
                {
                  label: "Quantity",
                  render: r => <span style={{ fontWeight: 700, color: C.red }}>{r.quantity}</span>
                },
                {
                  label: "Reason",
                  render: r => {
                    const { color, bg } = reasonColor(r.reason);
                    return (
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, background: bg, color, fontSize: 11, fontWeight: 700, border: `1px solid ${color}25` }}>
                        {r.reason}
                      </span>
                    );
                  }
                },
                {
                  label: "Notes",
                  render: r => <span style={{ color: C.muted, fontSize: 13 }}>{r.notes || "—"}</span>
                },
                {
                  label: "Disposed By",
                  render: r => <span style={{ color: C.muted, fontSize: 13 }}>{r.disposedBy || "Staff"}</span>
                },
                {
                  label: "",
                  render: r => isAdmin
                    ? (
                      <button onClick={() => setDeleteId(r.id || r._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "inline-flex", alignItems: "center", borderRadius: 8, color: C.dim, transition: "color 0.12s" }} onMouseEnter={e => e.currentTarget.style.color = C.red} onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                        <Icon name="trash" size={14} color="currentColor" />
                      </button>
                    )
                    : <span style={{ color: C.dim, fontSize: 12 }}>—</span>
                },
              ]}
              rows={filtered}
              emptyMsg="No disposal records found"
            />
            {filtered.length > 0 && (
              <p style={{ color: C.dim, fontSize: 12, marginTop: 10, textAlign: "right" }}>
                Showing {filtered.length} of {disposals.length}
              </p>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Disposal Record"
        message="This will permanently remove this disposal record. Stock will NOT be restored."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete Record"
      />
    </div>
  );
}
