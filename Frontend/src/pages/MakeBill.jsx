import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { C } from "../theme";
import { fmtCurrency, fmtDate, getDaysToExpiry, escapeHtml } from "../utils";
import { Btn, Card, Field, Icon, PageHdr, Table, inputSt, selectSt } from "../components/SharedUI";

const makeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const createRow = () => ({ id: makeId(), medicineId: "", quantity: "", unitPrice: 0, medicineName: "" });

const getInvoiceDateTime = (bill) => new Date(bill?.date || Date.now()).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function invoiceTitle(profile, bill) {
  return bill?.pharmacyName || profile.pharmacyName || "Your Pharmacy";
}

function invoiceAddress(profile, bill) {
  return bill?.pharmacyAddress || profile.address || "";
}

function invoiceContact(profile, bill) {
  return bill?.pharmacyPhone || profile.phone || profile.email || "";
}

function getLineTaxRates(medicine, customTax, useCustomTax) {
  if (useCustomTax) {
    return { cgst: Number(customTax.cgst) || 0, sgst: Number(customTax.sgst) || 0 };
  }
  return { cgst: Number(medicine?.cgst) || 0, sgst: Number(medicine?.sgst) || 0 };
}

function buildTaxSummary(rows, medicines, customTax, useCustomTax) {
  let subtotal = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  const lineDetails = [];

  rows.forEach((row) => {
    const medicine = medicines.find((entry) => (entry.id || entry._id) === row.medicineId);
    const qty = Number(row.quantity || 0);
    const unitPrice = Number(row.unitPrice || 0);
    const lineTotal = qty * unitPrice;
    const rates = getLineTaxRates(medicine, customTax, useCustomTax);
    const lineCgst = Number((lineTotal * rates.cgst / 100).toFixed(2));
    const lineSgst = Number((lineTotal * rates.sgst / 100).toFixed(2));
    subtotal += lineTotal;
    cgstAmount += lineCgst;
    sgstAmount += lineSgst;
    lineDetails.push({ ...row, medicine, lineTotal, rates, lineCgst, lineSgst });
  });

  const taxAmount = Number((cgstAmount + sgstAmount).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  return { subtotal, cgstAmount, sgstAmount, taxAmount, grandTotal, lineDetails };
}

export default function MakeBill({ medicines = [], bills = [], profile = {}, createBill, toast, canWrite = true }) {
  const [rows, setRows] = useState([createRow()]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [useCustomTax, setUseCustomTax] = useState(true);
  const [customTax, setCustomTax] = useState({ cgst: "6", sgst: "6" });

  const { subtotal, cgstAmount, sgstAmount, taxAmount, grandTotal } = useMemo(
    () => buildTaxSummary(rows, medicines, customTax, useCustomTax),
    [rows, medicines, customTax, useCustomTax]
  );

  const filteredBills = useMemo(() => {
    const term = search.toLowerCase();
    return bills.filter((bill) =>
      (bill.billNo || "").toLowerCase().includes(term) ||
      (bill.customerName || "").toLowerCase().includes(term) ||
      (bill.items || []).some((item) => (item.medicineName || "").toLowerCase().includes(term))
    );
  }, [bills, search]);

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const handleMedicineChange = (rowId, medicineId) => {
    const selectedMedicine = medicines.find((medicine) => (medicine.id || medicine._id) === medicineId);
    updateRow(rowId, {
      medicineId,
      medicineName: selectedMedicine?.name || "",
      unitPrice: Number(selectedMedicine?.price || 0),
    });
    setErrors((prev) => ({ ...prev, [rowId]: "" }));
  };

  const handleQuantityChange = (rowId, quantity) => {
    updateRow(rowId, { quantity });
    setErrors((prev) => ({ ...prev, [rowId]: "" }));
  };

  const addRow = () => setRows((prev) => [...prev, createRow()]);
  const removeRow = (rowId) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId)));

  const validate = () => {
    const nextErrors = {};
    rows.forEach((row) => {
      const medicine = medicines.find((entry) => (entry.id || entry._id) === row.medicineId);
      const quantity = Number(row.quantity);
      if (!row.medicineId) nextErrors[row.id] = "Choose a medicine";
      else if (!quantity || quantity <= 0) nextErrors[row.id] = "Enter a valid quantity";
      else if (medicine && quantity > medicine.quantity) nextErrors[row.id] = `Only ${medicine.quantity} units available`;
      else if (medicine && getDaysToExpiry(medicine.expiryDate) < 0) nextErrors[row.id] = "Medicine is expired";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setRows([createRow()]);
    setCustomerName("");
    setNotes("");
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        customerName,
        notes,
        pharmacyName: profile.pharmacyName || "",
        pharmacyAddress: profile.address || "",
        pharmacyPhone: profile.phone || "",
        pharmacyEmail: profile.email || "",
        gstin: profile.gstin || "",
        items: rows.map((row) => ({
          medicineId: row.medicineId,
          quantity: Number(row.quantity),
        })),
        useCustomTax,
        customCgst: Number(customTax.cgst) || 0,
        customSgst: Number(customTax.sgst) || 0,
      };
      const bill = await createBill(payload);
      toast(`Bill ${bill.billNo} created successfully`);
      setSelectedBill(bill);
      resetForm();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const printBillHtml = (bill) => {
    const itemsMarkup = (bill.items || []).map((item) => `
      <tr>
        <td>${escapeHtml(item.medicineName)}</td>
        <td style="text-align:center">${escapeHtml(item.quantity)}</td>
        <td style="text-align:right">${fmtCurrency(item.unitPrice || 0)}</td>
        <td style="text-align:right">${fmtCurrency(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td>
      </tr>
    `).join("");

    const gstin = bill.gstin || profile.gstin || "";
    const hasTax = (bill.cgstAmount || 0) + (bill.sgstAmount || 0) > 0;

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(bill.billNo)}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; min-height: 100vh; }
            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 32px 16px;
              font-family: Inter, Arial, sans-serif;
              color: #0f172a;
              background: #f1f5f9;
            }
            .page {
              width: 100%;
              max-width: 720px;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 36px 40px;
              box-shadow: 0 4px 24px rgba(15,23,42,0.08);
            }
            .header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #0f766e; }
            .eyebrow { margin: 0 0 6px; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #0f766e; font-weight: 700; }
            h1 { margin: 0; font-size: 24px; letter-spacing: -0.02em; color: #0f172a; }
            .meta, .contact { margin: 3px 0 0; font-size: 12px; line-height: 1.6; color: #475569; }
            .gstin { margin-top: 6px; font-size: 11px; color: #64748b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background: #f0fdfa; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; color: #0f766e; font-weight: 700; }
            .summary { display: flex; justify-content: flex-end; margin-top: 20px; }
            .summary-inner { min-width: 260px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; background: #f8fafc; }
            .summary-inner p { margin: 5px 0; font-size: 12px; color: #475569; display: flex; justify-content: space-between; gap: 24px; }
            .summary-inner .total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f766e; padding-top: 10px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; }
            @media print {
              body { background: #fff; padding: 0; display: block; }
              .page { max-width: 100%; border: none; box-shadow: none; border-radius: 0; padding: 24px; margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <p class="eyebrow">Tax Invoice</p>
                <h1>${escapeHtml(invoiceTitle(profile, bill))}</h1>
                <p class="meta">${escapeHtml(invoiceAddress(profile, bill) || "")}</p>
                <p class="contact">${escapeHtml(invoiceContact(profile, bill) || "")}</p>
                ${gstin ? `<p class="gstin">GSTIN: ${escapeHtml(gstin)}</p>` : ""}
              </div>
              <div style="text-align:right;">
                <p class="eyebrow">Bill Details</p>
                <p class="meta"><strong>Bill No.</strong> ${escapeHtml(bill.billNo)}</p>
                <p class="meta"><strong>Date</strong> ${escapeHtml(getInvoiceDateTime(bill))}</p>
                <p class="meta"><strong>Customer</strong> ${escapeHtml(bill.customerName || "Walk-in")}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th style="text-align:center">Qty</th>
                  <th style="text-align:right">Rate</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsMarkup}</tbody>
            </table>

            <div class="summary">
              <div class="summary-inner">
                <p><span>Taxable Amount</span><span>${fmtCurrency(bill.subtotal || 0)}</span></p>
                ${hasTax ? `<p><span>CGST</span><span>${fmtCurrency(bill.cgstAmount || 0)}</span></p>` : ""}
                ${hasTax ? `<p><span>SGST</span><span>${fmtCurrency(bill.sgstAmount || 0)}</span></p>` : ""}
                ${hasTax ? `<p><span>Total Tax</span><span>${fmtCurrency(bill.taxAmount || 0)}</span></p>` : ""}
                <p class="total"><span>Grand Total</span><span>${fmtCurrency(bill.grandTotal || 0)}</span></p>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your business · ${escapeHtml(invoiceTitle(profile, bill))}</p>
              ${bill.notes ? `<p>Notes: ${escapeHtml(bill.notes)}</p>` : ""}
            </div>
          </div>
        </body>
      </html>`;
  };

  const printBill = (bill) => {
    if (!bill) return;
    const win = window.open("", "_blank", "width=980,height=780");
    if (!win) {
      toast("Pop-up blocked. Allow pop-ups to print bills.", "error");
      return;
    }
    win.document.open();
    win.document.write(printBillHtml(bill));
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    };
  };

  const downloadPdf = (bill) => {
    if (!bill) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(invoiceTitle(profile, bill), margin, 44);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceAddress(profile, bill) || "", margin, 58);
    doc.text(invoiceContact(profile, bill) || "", margin, 70);
    if (profile.gstin) doc.text(`GSTIN: ${profile.gstin}`, margin, 82);

    doc.setFont("helvetica", "bold");
    doc.text(`Bill No: ${bill.billNo}`, 390, 44);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${getInvoiceDateTime(bill)}`, 390, 58);
    doc.text(`Customer: ${bill.customerName || "Walk-in"}`, 390, 72);

    autoTable(doc, {
      startY: 96,
      head: [["Medicine", "Qty", "Rate", "Amount"]],
      body: (bill.items || []).map((item) => [
        item.medicineName,
        String(item.quantity),
        fmtCurrency(item.unitPrice || 0),
        fmtCurrency(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
      ]),
      styles: { fontSize: 9, cellPadding: 7 },
      headStyles: { fillColor: [15, 118, 110] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });

    const footerY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 140;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Taxable Amount: ${fmtCurrency(bill.subtotal || 0)}`, margin, footerY);
    if ((bill.cgstAmount || 0) > 0) doc.text(`CGST: ${fmtCurrency(bill.cgstAmount)}`, margin, footerY + 14);
    if ((bill.sgstAmount || 0) > 0) doc.text(`SGST: ${fmtCurrency(bill.sgstAmount)}`, margin, footerY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Grand Total: ${fmtCurrency(bill.grandTotal || 0)}`, margin, footerY + 48);
    doc.save(`${bill.billNo}.pdf`);
  };

  const previewBill = selectedBill || null;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <PageHdr tag="Billing" title="Make Bill" sub="Create GST-compliant bills, deduct stock automatically, and print professional invoices" />

      <div style={{ display: "grid", gridTemplateColumns: canWrite ? "minmax(0,1.12fr) minmax(320px,0.88fr)" : "1fr", gap: 22, alignItems: "start" }}>
        {canWrite && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, color: C.teal }}>Bill Builder</p>
                <h2 style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>New Bill</h2>
              </div>
              <Btn variant="green" size="sm" icon="receipt" onClick={() => setShowTaxModal(true)}>Custom Tax</Btn>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
                <Field label="Customer Name (Optional)">
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer" style={inputSt()} />
                </Field>
                <Field label="Notes">
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes or remarks" style={inputSt()} />
                </Field>
              </div>

              {(useCustomTax || taxAmount > 0) && (
                <div style={{ display: "flex", gap: 16, padding: "10px 14px", background: "rgba(15,118,110,0.06)", borderRadius: 10, border: "1px solid rgba(15,118,110,0.15)", fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                  <span>Tax mode: <strong style={{ color: C.teal }}>{useCustomTax ? `Custom CGST ${customTax.cgst}% · SGST ${customTax.sgst}%` : "Per medicine rates"}</strong></span>
                  {profile.gstin && <span>GSTIN: <strong style={{ color: C.text }}>{profile.gstin}</strong></span>}
                </div>
              )}

              <div style={{ display: "grid", gap: 12 }}>
                {rows.map((row, index) => {
                  const rowError = errors[row.id];
                  const medicine = medicines.find((m) => (m.id || m._id) === row.medicineId);
                  const rates = getLineTaxRates(medicine, customTax, useCustomTax);
                  return (
                    <div key={row.id} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, background: C.surfaceHover }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.7fr 0.8fr 0.9fr auto", gap: 12, alignItems: "end" }}>
                        <Field label={`Medicine ${index + 1}`} required error={rowError}>
                          <select value={row.medicineId} onChange={(e) => handleMedicineChange(row.id, e.target.value)} style={selectSt}>
                            <option value="">Select medicine</option>
                            {medicines.map((med) => (
                              <option key={med.id || med._id} value={med.id || med._id} style={{ background: C.surface }}>
                                {med.name} ({med.quantity} left)
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Quantity" required>
                          <input type="number" min="1" value={row.quantity} onChange={(e) => handleQuantityChange(row.id, e.target.value)} style={inputSt()} placeholder="0" />
                        </Field>
                        <Field label="Unit Price">
                          <input value={fmtCurrency(row.unitPrice || 0)} readOnly style={{ ...inputSt(), background: C.surfaceHover, cursor: "not-allowed" }} />
                        </Field>
                        <Field label="Line Total">
                          <input value={fmtCurrency(Number(row.quantity || 0) * Number(row.unitPrice || 0))} readOnly style={{ ...inputSt(), background: C.surfaceHover, cursor: "not-allowed" }} />
                        </Field>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => removeRow(row.id)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="trash" size={14} color="currentColor" />
                          </button>
                        </div>
                      </div>
                      {medicine && (rates.cgst || rates.sgst) ? (
                        <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted }}>Tax: CGST {rates.cgst}% · SGST {rates.sgst}%</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn variant="secondary" onClick={addRow}>Add Another Row</Btn>
                  <Btn variant="ghost" onClick={resetForm}>Reset</Btn>
                </div>
                <div style={{ textAlign: "right", minWidth: 200 }}>
                  <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>Taxable Amount</p>
                  <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: C.text }}>{fmtCurrency(subtotal)}</p>
                  {taxAmount > 0 && (
                    <>
                      <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 11 }}>CGST {fmtCurrency(cgstAmount)} · SGST {fmtCurrency(sgstAmount)}</p>
                      <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 12 }}>Grand Total</p>
                      <p style={{ margin: "2px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 800, color: C.teal }}>{fmtCurrency(grandTotal)}</p>
                    </>
                  )}
                  {taxAmount === 0 && (
                    <p style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 800, color: C.text }}>{fmtCurrency(grandTotal)}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                <Btn variant="primary" onClick={handleSubmit} style={{ minWidth: 180, justifyContent: "center" }}>Complete Bill</Btn>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, color: C.teal }}>Invoice History</p>
              <h2 style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>Saved Bills</h2>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bills, customer, or medicine..." style={inputSt()} />
          </div>

          <Table
            cols={[
              { label: "Bill #", render: r => <span style={{ color: C.teal, fontWeight: 700 }}>{r.billNo}</span> },
              { label: "Customer", render: r => <span style={{ color: C.text, fontWeight: 600 }}>{r.customerName || "Walk-in"}</span> },
              { label: "Items", render: r => <span>{(r.items || []).length}</span> },
              { label: "Total", render: r => <span style={{ fontWeight: 700 }}>{fmtCurrency(r.grandTotal || 0)}</span> },
              { label: "Date", render: r => <span style={{ color: C.muted, fontSize: 13 }}>{fmtDate(r.date)}</span> },
              { label: "", render: r => (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn size="sm" variant="secondary" onClick={() => setSelectedBill(r)}>Preview</Btn>
                </div>
              )},
            ]}
            rows={filteredBills}
            emptyMsg="No bills have been created yet"
          />
        </Card>
      </div>

      {showTaxModal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ width: "100%", maxWidth: 440, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", animation: "fadeUp 0.2s ease" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Custom Tax Settings</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Set CGST & SGST for this bill</p>
              </div>
              <button onClick={() => setShowTaxModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceHover, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text, cursor: "pointer" }}>
                <input type="radio" checked={useCustomTax} onChange={() => setUseCustomTax(true)} />
                Use custom tax rates for all items
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text, cursor: "pointer" }}>
                <input type="radio" checked={!useCustomTax} onChange={() => setUseCustomTax(false)} />
                Use per-medicine tax rates (from inventory)
              </label>
              {useCustomTax && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="CGST (%)">
                    <input type="number" min="0" max="100" step="0.01" value={customTax.cgst} onChange={e => setCustomTax(p => ({ ...p, cgst: e.target.value }))} style={inputSt()} />
                  </Field>
                  <Field label="SGST (%)">
                    <input type="number" min="0" max="100" step="0.01" value={customTax.sgst} onChange={e => setCustomTax(p => ({ ...p, sgst: e.target.value }))} style={inputSt()} />
                  </Field>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn variant="danger" onClick={() => setShowTaxModal(false)}>Close</Btn>
              <Btn variant="primary" onClick={() => setShowTaxModal(false)}>Apply</Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {previewBill && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "hidden", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}`, padding: "20px 24px", flexShrink: 0 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, color: C.teal }}>Tax Invoice Preview</p>
                <h3 style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>{previewBill.billNo}</h3>
              </div>
              <button onClick={() => setSelectedBill(null)} aria-label="Close invoice" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="close" size={16} color={C.muted} />
              </button>
            </div>

            <div style={{ overflowY: "auto", padding: 24, flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 560, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 32px", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.teal}` }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Tax Invoice</p>
                    <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 700, color: C.text }}>{invoiceTitle(profile, previewBill)}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{invoiceAddress(profile, previewBill)}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{invoiceContact(profile, previewBill)}</p>
                    {profile.gstin && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted, fontWeight: 600 }}>GSTIN: {profile.gstin}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Bill Details</p>
                    <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700, color: C.text }}>{previewBill.billNo}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: C.text }}>{getInvoiceDateTime(previewBill)}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: C.text }}>Customer: {previewBill.customerName || "Walk-in"}</p>
                  </div>
                </div>

                <Table
                  cols={[
                    { label: "Medicine", render: r => r.medicineName },
                    { label: "Qty", render: r => r.quantity },
                    { label: "Rate", render: r => fmtCurrency(r.unitPrice || 0) },
                    { label: "Amount", render: r => fmtCurrency(r.lineTotal || Number(r.quantity || 0) * Number(r.unitPrice || 0)) },
                  ]}
                  rows={previewBill.items || []}
                  emptyMsg="No line items"
                />

                <div style={{ marginTop: 20, padding: "14px 18px", background: C.surfaceHover, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 6 }}>
                    <span>Taxable Amount</span><span>{fmtCurrency(previewBill.subtotal || 0)}</span>
                  </div>
                  {(previewBill.cgstAmount || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 4 }}>
                      <span>CGST</span><span>{fmtCurrency(previewBill.cgstAmount)}</span>
                    </div>
                  )}
                  {(previewBill.sgstAmount || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 4 }}>
                      <span>SGST</span><span>{fmtCurrency(previewBill.sgstAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: C.text, borderTop: `2px solid ${C.teal}`, paddingTop: 10, marginTop: 8 }}>
                    <span>Grand Total</span><span>{fmtCurrency(previewBill.grandTotal || 0)}</span>
                  </div>
                </div>

                {previewBill.notes && <p style={{ margin: "12px 0 0", fontSize: 12, color: C.muted }}><strong>Notes:</strong> {previewBill.notes}</p>}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, padding: "16px 24px", flexShrink: 0 }}>
              <Btn variant="danger" onClick={() => setSelectedBill(null)}>Close</Btn>
              <Btn variant="secondary" onClick={() => printBill(previewBill)}>Print Bill</Btn>
              <Btn variant="primary" onClick={() => downloadPdf(previewBill)}>Download PDF</Btn>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
