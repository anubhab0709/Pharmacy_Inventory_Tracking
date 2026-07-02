import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { C } from "../theme";
import { fmtCurrency, fmtDate } from "../utils";
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

export default function MakeBill({ medicines = [], bills = [], profile = {}, createBill, toast, canWrite = true }) {
  const [rows, setRows] = useState([createRow()]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  const subtotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.quantity || 0) * Number(row.unitPrice || 0)), 0),
    [rows]
  );

  const grandTotal = subtotal;

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
        items: rows.map((row) => ({
          medicineId: row.medicineId,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice || 0),
        })),
        grandTotal,
      };
      const bill = await createBill(payload);
      toast(`Bill ${bill.billNo} created successfully`);
      setSelectedBill(bill);
      resetForm();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const printBill = (bill) => {
    if (!bill) return;
    const win = window.open("", "_blank", "width=980,height=780");
    if (!win) {
      toast("Pop-up blocked. Allow pop-ups to print bills.", "error");
      return;
    }

    const itemsMarkup = (bill.items || []).map((item) => `
      <tr>
        <td>${item.medicineName}</td>
        <td>${item.quantity}</td>
        <td>${fmtCurrency(item.unitPrice || 0)}</td>
        <td>${fmtCurrency(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${bill.billNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Inter, Arial, sans-serif; color: #0f172a; background: #fff; }
            .page { max-width: 860px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
            .eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #0f766e; font-weight: 700; }
            h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; }
            .meta, .contact { margin: 4px 0 0; font-size: 13px; line-height: 1.55; color: #334155; }
            .box { padding: 18px 20px; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 14px 16px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: #475569; }
            .summary { display: flex; justify-content: flex-end; margin-top: 18px; }
            .summary-inner { min-width: 240px; }
            .summary-inner p { margin: 6px 0; font-size: 13px; color: #334155; }
            .summary-inner .total { font-size: 20px; font-weight: 800; color: #0f172a; }
            .footer { display: flex; justify-content: space-between; gap: 18px; margin-top: 28px; font-size: 12px; color: #475569; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div>
                <p class="eyebrow">Tax Invoice</p>
                <h1>${invoiceTitle(profile, bill)}</h1>
                <p class="meta">${invoiceAddress(profile, bill) || ""}</p>
                <p class="contact">${invoiceContact(profile, bill) || ""}</p>
              </div>
              <div style="text-align:right;">
                <p class="eyebrow">Bill Details</p>
                <p class="meta"><strong>Bill No.</strong> ${bill.billNo}</p>
                <p class="meta"><strong>Date & Time</strong> ${getInvoiceDateTime(bill)}</p>
                <p class="meta"><strong>Customer</strong> ${bill.customerName || "Optional"}</p>
              </div>
            </div>

            <div class="box">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsMarkup}
                </tbody>
              </table>
            </div>

            <div class="summary">
              <div class="summary-inner">
                <p><strong>Subtotal</strong> ${fmtCurrency(bill.subtotal || 0)}</p>
                <p class="total">Grand Total ${fmtCurrency(bill.grandTotal || 0)}</p>
              </div>
            </div>

            <div class="footer">
              <span>Generated from the pharmacy billing system.</span>
              <span>Thank you for your business.</span>
            </div>
          </div>
        </body>
      </html>`;

    win.document.open();
    win.document.write(html);
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
    doc.setFontSize(20);
    doc.text(invoiceTitle(profile, bill), margin, 44);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceAddress(profile, bill) || "", margin, 62);
    doc.text(invoiceContact(profile, bill) || "", margin, 76);

    doc.setFont("helvetica", "bold");
    doc.text(`Bill No: ${bill.billNo}`, 390, 44);
    doc.setFont("helvetica", "normal");
    doc.text(`Date & Time: ${getInvoiceDateTime(bill)}`, 390, 60);
    doc.text(`Customer: ${bill.customerName || "Optional"}`, 390, 76);

    autoTable(doc, {
      startY: 100,
      head: [["Medicine", "Qty", "Unit Price", "Line Total"]],
      body: (bill.items || []).map((item) => [
        item.medicineName,
        String(item.quantity),
        fmtCurrency(item.unitPrice || 0),
        fmtCurrency(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
      ]),
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [15, 118, 110] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });

    const footerY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 24 : 140;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal: ${fmtCurrency(bill.subtotal || 0)}`, margin, footerY);
    doc.text(`Grand Total: ${fmtCurrency(bill.grandTotal || 0)}`, margin, footerY + 18);
    doc.save(`${bill.billNo}.pdf`);
  };

  const previewBill = selectedBill || null;

  return (
    <div style={{animation:"fadeUp 0.4s ease both"}}>
      <PageHdr tag="Billing" title="Make Bill" sub="Create multi-item bills, deduct stock automatically, and export professional invoices" />

      <div style={{display:"grid",gridTemplateColumns:canWrite?"minmax(0,1.12fr) minmax(320px,0.88fr)":"1fr",gap:22,alignItems:"start"}}>
        {canWrite && (
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:20}}>
              <div>
                <p style={{margin:0,fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,color:C.teal}}>Bill Builder</p>
                <h2 style={{margin:"4px 0 0",fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:C.text}}>New Bill</h2>
              </div>
              <Btn variant="secondary" size="sm" icon="plus" onClick={addRow}>Add Row</Btn>
            </div>

            <div style={{display:"grid",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
                <Field label="Customer Name (Optional)">
                  <input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="Walk-in customer" style={inputSt()} />
                </Field>
                <Field label="Notes">
                  <input value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Internal notes or remarks" style={inputSt()} />
                </Field>
              </div>

              <div style={{display:"grid",gap:12}}>
                {rows.map((row, index) => {
                  const rowError = errors[row.id];
                  return (
                    <div key={row.id} style={{border:`1px solid ${C.border}`,borderRadius:16,padding:16,background:C.surfaceHover}}>
                      <div style={{display:"grid",gridTemplateColumns:"1.6fr 0.7fr 0.8fr 0.9fr auto",gap:12,alignItems:"end"}}>
                        <Field label={`Medicine ${index + 1}`} required error={rowError}>
                          <select value={row.medicineId} onChange={(e) => handleMedicineChange(row.id, e.target.value)} style={selectSt}>
                            <option value="">Select medicine</option>
                            {medicines.map((medicine) => (
                              <option key={medicine.id || medicine._id} value={medicine.id || medicine._id} style={{background:C.surface}}>
                                {medicine.name} ({medicine.quantity} left)
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Quantity" required>
                          <input type="number" min="1" value={row.quantity} onChange={(e) => handleQuantityChange(row.id, e.target.value)} style={inputSt()} placeholder="0" />
                        </Field>
                        <Field label="Unit Price">
                          <input value={fmtCurrency(row.unitPrice || 0)} readOnly style={{...inputSt(),background:C.surfaceHover,cursor:"not-allowed"}} />
                        </Field>
                        <Field label="Line Total">
                          <input value={fmtCurrency(Number(row.quantity || 0) * Number(row.unitPrice || 0))} readOnly style={{...inputSt(),background:C.surfaceHover,cursor:"not-allowed"}} />
                        </Field>
                        <div style={{display:"flex",justifyContent:"flex-end"}}>
                          <button type="button" onClick={() => removeRow(row.id)} style={{width:40,height:40,borderRadius:12,border:`1px solid ${C.border}`,background:C.surface,color:C.red,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Icon name="trash" size={14} color="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:6}}>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <Btn variant="secondary" onClick={addRow}>Add Another Row</Btn>
                  <Btn variant="ghost" onClick={resetForm}>Reset</Btn>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{margin:0,color:C.muted,fontSize:13}}>Subtotal</p>
                  <p style={{margin:"4px 0 0",fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:800,color:C.text}}>{fmtCurrency(subtotal)}</p>
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",gap:10,borderTop:`1px solid ${C.border}`,paddingTop:18}}>
                <Btn variant="primary" onClick={handleSubmit} style={{minWidth:180,justifyContent:"center"}}>Complete Bill</Btn>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
            <div>
              <p style={{margin:0,fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,color:C.teal}}>Invoice History</p>
              <h2 style={{margin:"4px 0 0",fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:C.text}}>Saved Bills</h2>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bills, customer, or medicine..." style={inputSt()} />
          </div>

          <Table
            cols={[
              {label:"Bill #", render:r=><span style={{color:C.teal,fontWeight:700}}>{r.billNo}</span>},
              {label:"Customer", render:r=><span style={{color:C.text,fontWeight:600}}>{r.customerName || "Optional"}</span>},
              {label:"Items", render:r=><span>{(r.items || []).length}</span>},
              {label:"Total", render:r=><span style={{fontWeight:700}}>{fmtCurrency(r.grandTotal || 0)}</span>},
              {label:"Date", render:r=><span style={{color:C.muted,fontSize:13}}>{fmtDate(r.date)}</span>},
              {label:"", render:r=>(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Btn size="sm" variant="secondary" onClick={() => setSelectedBill(r)}>Preview</Btn>
                </div>
              )},
            ]}
            rows={filteredBills}
            emptyMsg="No bills have been created yet"
          />
        </Card>
      </div>

      {previewBill && createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div role="dialog" aria-modal="true" style={{width:"100%",maxWidth:820,maxHeight:"90vh",overflow:"hidden",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:"0 24px 60px rgba(15,23,42,0.18)",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,borderBottom:`1px solid ${C.border}`,padding:"20px 24px",flexShrink:0}}>
              <div>
                <p style={{margin:0,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,color:C.teal}}>Invoice Preview</p>
                <h3 style={{margin:"4px 0 0",fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:C.text}}>{previewBill.billNo}</h3>
              </div>
              <button onClick={() => setSelectedBill(null)} aria-label="Close invoice" style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.border}`,background:C.surfaceHover,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <Icon name="close" size={16} color={C.muted} />
              </button>
            </div>

            <div style={{overflowY:"auto",padding:24,flex:1}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>
                <div>
                  <p style={{margin:0,fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Pharmacy</p>
                  <p style={{margin:"8px 0 0",fontSize:18,fontWeight:700,color:C.text}}>{invoiceTitle(profile, previewBill)}</p>
                  <p style={{margin:"4px 0 0",fontSize:14,color:C.text}}>{invoiceAddress(profile, previewBill)}</p>
                  <p style={{margin:"4px 0 0",fontSize:14,color:C.text}}>{invoiceContact(profile, previewBill)}</p>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{margin:0,fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Bill Details</p>
                  <p style={{margin:"8px 0 0",fontSize:18,fontWeight:700,color:C.text}}>{previewBill.billNo}</p>
                  <p style={{margin:"4px 0 0",fontSize:14,color:C.text}}><strong>Date & Time:</strong> {getInvoiceDateTime(previewBill)}</p>
                  <p style={{margin:"4px 0 0",fontSize:14,color:C.text}}><strong>Customer:</strong> {previewBill.customerName || "Optional"}</p>
                </div>
              </div>

              <Table
                cols={[
                  {label:"Medicine", render:r => r.medicineName},
                  {label:"Qty", render:r => r.quantity},
                  {label:"Unit Price", render:r => fmtCurrency(r.unitPrice || 0)},
                  {label:"Line Total", render:r => fmtCurrency(r.lineTotal || Number(r.quantity || 0) * Number(r.unitPrice || 0))},
                ]}
                rows={previewBill.items || []}
                emptyMsg="No line items"
              />

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:16,marginTop:20,flexWrap:"wrap"}}>
                <div style={{color:C.muted,fontSize:13,lineHeight:1.6}}>
                  {previewBill.notes ? <p style={{margin:0}}><strong>Notes:</strong> {previewBill.notes}</p> : <p style={{margin:0}}>No additional notes.</p>}
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{margin:0,fontSize:13,color:C.muted}}>Subtotal</p>
                  <p style={{margin:"4px 0 0",fontSize:16,fontWeight:700,color:C.text}}>{fmtCurrency(previewBill.subtotal || 0)}</p>
                  <p style={{margin:"10px 0 0",fontSize:13,color:C.muted}}>Grand Total</p>
                  <p style={{margin:"4px 0 0",fontSize:24,fontWeight:800,color:C.text}}>{fmtCurrency(previewBill.grandTotal || 0)}</p>
                </div>
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"flex-end",gap:10,borderTop:`1px solid ${C.border}`,padding:"16px 24px",flexShrink:0}}>
              <Btn variant="ghost" onClick={() => setSelectedBill(null)}>Close</Btn>
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