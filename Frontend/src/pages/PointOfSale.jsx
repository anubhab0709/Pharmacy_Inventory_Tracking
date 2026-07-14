import React, { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../theme";
import { fmtCurrency, getDaysToExpiry, escapeHtml } from "../utils";
import { Btn, Icon, PageHdr, inputSt } from "../components/SharedUI";

const makeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function PointOfSale({ medicines = [], createBill, profile = {}, toast }) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);

  const videoRef = useRef(null);
  const scannerInputRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [cart]);
  const taxPreview = useMemo(() => {
    return cart.reduce((acc, item) => {
      const med = medicines.find(m => (m._id || m.id) === item.medicineId);
      const line = item.quantity * item.unitPrice;
      acc.cgst += line * (Number(med?.cgst) || 0) / 100;
      acc.sgst += line * (Number(med?.sgst) || 0) / 100;
      return acc;
    }, { cgst: 0, sgst: 0 });
  }, [cart, medicines]);
  const discountedSubtotal = Math.max(0, subtotal - (subtotal * (Number(discount) || 0) / 100));
  const taxScale = subtotal > 0 ? discountedSubtotal / subtotal : 1;
  const cgstAmount = Number((taxPreview.cgst * taxScale).toFixed(2));
  const sgstAmount = Number((taxPreview.sgst * taxScale).toFixed(2));
  const grandTotal = Number((discountedSubtotal + cgstAmount + sgstAmount).toFixed(2));

  // Filter medicines for quick-add grid
  const filteredMedicines = useMemo(() => {
    const q = medicineSearch.toLowerCase();
    return medicines
      .filter(m => m.quantity > 0)
      .filter(m => !q || m.name.toLowerCase().includes(q) || (m.category || "").toLowerCase().includes(q))
      .slice(0, 24);
  }, [medicines, medicineSearch]);

  // Auto-focus scanner input
  useEffect(() => {
    if (scannerInputRef.current && !isCameraActive && !receiptBill) {
      scannerInputRef.current.focus();
    }
  }, [cart, isCameraActive, receiptBill]);

  const addToCart = (medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === (medicine.id || medicine._id));
      if (existing) {
        if (existing.quantity >= medicine.quantity) {
          toast.error(`Only ${medicine.quantity} units of ${medicine.name} available in stock`);
          return prev;
        }
        return prev.map(item => item.medicineId === (medicine.id || medicine._id) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (medicine.quantity <= 0) {
        toast.error(`${medicine.name} is out of stock`);
        return prev;
      }
      const daysToExp = getDaysToExpiry(medicine.expiryDate);
      if (daysToExp < 0) {
        toast.error(`${medicine.name} is expired and cannot be sold`);
        return prev;
      }
      if (daysToExp <= 30) {
        toast(`${medicine.name} expires in ${daysToExp} days`, "warning");
      }
      return [{
        id: makeId(),
        medicineId: medicine.id || medicine._id,
        medicineName: medicine.name,
        quantity: 1,
        unitPrice: Number(medicine.price || 0),
        maxQuantity: medicine.quantity,
        expiryDate: medicine.expiryDate,
      }, ...prev];
    });
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim();
    const match = medicines.find(m => m.barcode === code || m.name.toLowerCase() === code.toLowerCase());
    if (match) {
      addToCart(match);
      setBarcodeInput("");
    } else {
      toast.error("Medicine not found for this code");
      setBarcodeInput("");
    }
  };

  const startCamera = async () => {
    if (!('BarcodeDetector' in window)) {
      toast.error("Camera scanning is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        scanningRef.current = true;
        setIsCameraActive(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      toast.error("Failed to access camera");
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanFrame = async () => {
    if (!scanningRef.current || !videoRef.current || !streamRef.current) return;
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128', 'upc_a'] });
      const barcodes = await barcodeDetector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        stopCamera();
        const match = medicines.find(m => m.barcode === code);
        if (match) addToCart(match);
        else toast.error("Unrecognized barcode: " + code);
      } else if (scanningRef.current) {
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      if (scanningRef.current) requestAnimationFrame(scanFrame);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const payload = {
        customerName: customerName || "Walk-in Customer",
        notes: discount > 0 ? `Discount applied: ${discount}%` : "POS Checkout",
        pharmacyName: profile.pharmacyName || "",
        pharmacyAddress: profile.address || "",
        pharmacyPhone: profile.phone || "",
        pharmacyEmail: profile.email || "",
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
        })),
        discountPercent: Number(discount) || 0,
        useCustomTax: false,
      };
      const bill = await createBill(payload);
      setReceiptBill(bill);
      setCart([]);
      setDiscount(0);
      setCustomerName("");
      toast.success("Checkout successful");
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const printReceipt = (bill) => {
    if (!bill) return;
    const win = window.open("", "_blank", "width=420,height=650");
    if (!win) { toast.error("Pop-up blocked. Allow pop-ups to print receipts."); return; }
    const itemsMarkup = (bill.items || []).map(item => `
      <tr>
        <td style="padding:5px 0;border-bottom:1px dashed #ddd;">${escapeHtml(item.medicineName)}<br/><small style="color:#888">${escapeHtml(item.quantity)} × ₹${escapeHtml(item.unitPrice)}</small></td>
        <td style="padding:5px 0;border-bottom:1px dashed #ddd;text-align:right;font-weight:bold;">₹${escapeHtml(item.quantity * item.unitPrice)}</td>
      </tr>
    `).join("");
    const html = `<html><head><meta charset="utf-8"/><title>Receipt ${escapeHtml(bill.billNo)}</title>
      <style>body{font-family:monospace;font-size:13px;margin:0;padding:20px;color:#000;width:320px;}.center{text-align:center;}h2{margin:5px 0;font-size:17px;}p{margin:3px 0;}table{width:100%;border-collapse:collapse;margin-top:10px;}th{border-bottom:2px solid #000;padding-bottom:5px;text-align:left;}.totals{margin-top:10px;border-top:2px solid #000;padding-top:10px;}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:15px;}@media print{body{padding:0;}}</style>
      </head><body onload="window.print();">
      <div class="center"><h2>${escapeHtml(profile.pharmacyName || "Pharmacy")}</h2><p>${escapeHtml(profile.address || "")}</p><p>${escapeHtml(profile.phone || "")}</p><p>================================</p><p><strong>Receipt: ${escapeHtml(bill.billNo)}</strong></p><p>Date: ${escapeHtml(new Date(bill.date || bill.createdAt).toLocaleString())}</p>${bill.customerName && bill.customerName !== "Walk-in Customer" ? `<p>Customer: ${escapeHtml(bill.customerName)}</p>` : ""}</div>
      <table><thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>${itemsMarkup}</tbody></table>
      <div class="totals"><div class="total-row"><span>TOTAL</span><span>₹${escapeHtml(bill.grandTotal)}</span></div></div>
      <div class="center" style="margin-top:20px;"><p>Thank you for your visit!</p><p>${escapeHtml(profile.pharmacyName || "Pharmacy")}</p></div>
      </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHdr tag="Billing" title="Point of Sale" sub="Scan barcodes or search to quickly checkout customers" />
      
      <div style={{ display: "flex", gap: 24, flex: 1, marginTop: 24, minHeight: 0 }}>
        
        {/* Left Side: Scanner & Medicine Grid */}
        <div style={{ flex: "2", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          
          <div style={{ background: C.surface, padding: 20, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 15, color: C.text, fontWeight: 700 }}>Add Item</h3>
            <form onSubmit={handleBarcodeSubmit} style={{ display: "flex", gap: 10 }}>
              <input
                ref={scannerInputRef}
                type="text"
                placeholder="Scan barcode or type medicine name..."
                style={{ ...inputSt(), flex: 1, fontSize: 15, padding: "12px 16px" }}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                autoFocus
              />
              <Btn type="submit" variant="primary">Add</Btn>
              <Btn type="button" variant="secondary" onClick={startCamera}>
                <Icon name="barcode" size={18} /> Camera
              </Btn>
            </form>

            {isCameraActive && (
              <div style={{ marginTop: 14, position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", height: 260 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "70%", height: 100, border: "2px dashed rgba(255,255,255,0.7)", borderRadius: 12, pointerEvents: "none" }}></div>
                <button onClick={stopCamera} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={16} />
                </button>
                <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 12, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Align barcode in frame</div>
              </div>
            )}
          </div>

          {/* Quick Add Medicine Grid */}
          <div style={{ background: C.surface, padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: C.text, fontWeight: 700 }}>Quick Add</h3>
              <input
                type="text"
                placeholder="Search medicines..."
                value={medicineSearch}
                onChange={e => setMedicineSearch(e.target.value)}
                style={{ ...inputSt(), width: 220, padding: "8px 12px", fontSize: 13 }}
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                {filteredMedicines.map(med => {
                  const daysToExp = getDaysToExpiry(med.expiryDate);
                  const isExpiring = daysToExp >= 0 && daysToExp <= 30;
                  const isExpired = daysToExp < 0;
                  return (
                    <button
                      key={med._id || med.id}
                      onClick={() => addToCart(med)}
                      disabled={isExpired}
                      style={{ padding: 14, background: isExpired ? C.bg : C.surfaceHover, border: `1px solid ${isExpiring ? C.orange : C.border}`, borderRadius: 12, cursor: isExpired ? "not-allowed" : "pointer", textAlign: "left", transition: "all 0.15s", position: "relative" }}
                    >
                      {isExpiring && !isExpired && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.orange }}></div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: isExpired ? C.muted : C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{med.name}</div>
                      <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>{fmtCurrency(med.price || 0)}</div>
                      <div style={{ fontSize: 11, color: isExpired ? C.red : C.muted, marginTop: 6 }}>
                        {isExpired ? "Expired" : `${med.quantity} in stock`}
                      </div>
                    </button>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <p style={{ color: C.muted, fontSize: 13, gridColumn: "1/-1", textAlign: "center", padding: "24px 0" }}>No medicines found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Cart */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 15, color: C.text, fontWeight: 700 }}>Current Sale</h3>
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{ ...inputSt(), padding: "8px 12px", fontSize: 13 }}
            />
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", color: C.muted, marginTop: 40 }}>
                <Icon name="pos" size={48} color={C.border} style={{ marginBottom: 16 }} />
                <p style={{ marginBottom: 6 }}>Cart is empty</p>
                <p style={{ fontSize: 12 }}>Scan or click an item to add</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {cart.map(item => {
                  const daysToExp = getDaysToExpiry(item.expiryDate);
                  const isExpiring = daysToExp >= 0 && daysToExp <= 30;
                  return (
                    <div key={item.id} style={{ paddingBottom: 14, borderBottom: `1px dashed ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.medicineName}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{fmtCurrency(item.unitPrice)} each</div>
                          {isExpiring && (
                            <div style={{ fontSize: 11, color: C.orange, marginTop: 2 }}>⚠ Expires in {daysToExp} days</div>
                          )}
                        </div>
                        <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.red, padding: 4, marginLeft: 8 }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                          <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} style={{ padding: "4px 10px", background: C.surfaceHover, border: "none", cursor: "pointer", fontSize: 15 }}>−</button>
                          <span style={{ padding: "0 12px", fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                          <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + 1) } : i))} style={{ padding: "4px 10px", background: C.surfaceHover, border: "none", cursor: "pointer", fontSize: 15 }}>+</button>
                        </div>
                        <div style={{ fontWeight: 700, color: C.text }}>
                          {fmtCurrency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: 20, borderTop: `1px solid ${C.border}`, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: C.muted }}>
              <span>Subtotal</span>
              <span>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: C.muted, alignItems: "center" }}>
              <span>Discount (%)</span>
              <input type="number" value={discount} onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))} style={{ ...inputSt(), width: 80, padding: "5px 8px", textAlign: "right", fontSize: 13 }} min="0" max="100" />
            </div>
            {(cgstAmount > 0 || sgstAmount > 0) && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: C.muted }}>
                  <span>CGST</span><span>{fmtCurrency(cgstAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: C.muted }}>
                  <span>SGST</span><span>{fmtCurrency(sgstAmount)}</span>
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 22, fontWeight: 800, color: C.text }}>
              <span>Total</span>
              <span style={{ color: C.teal }}>{fmtCurrency(grandTotal)}</span>
            </div>
            <Btn variant="primary" style={{ width: "100%", padding: "14px 0", fontSize: 15, justifyContent: "center" }} onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut}>
              {isCheckingOut ? "Processing..." : `Charge ${fmtCurrency(grandTotal)}`}
            </Btn>
          </div>
        </div>

      </div>

      {/* Receipt Modal */}
      {receiptBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.surface, padding: 36, borderRadius: 20, width: 420, textAlign: "center", position: "relative", boxShadow: "0 24px 48px rgba(0,0,0,0.18)", animation: "fadeUp 0.2s ease" }}>
            <button onClick={() => setReceiptBill(null)} style={{ position: "absolute", top: 16, right: 16, background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
              <Icon name="close" size={18} />
            </button>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${C.teal}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="check" size={32} color={C.teal} />
            </div>
            <h2 style={{ margin: "0 0 6px 0", fontSize: 22, color: C.text }}>Sale Complete!</h2>
            <p style={{ color: C.muted, marginBottom: 6, fontSize: 14 }}>Bill No: <strong style={{ color: C.teal }}>{receiptBill.billNo}</strong></p>
            <p style={{ color: C.muted, marginBottom: 24, fontSize: 14 }}>Total: <strong style={{ color: C.text }}>{fmtCurrency(receiptBill.grandTotal)}</strong></p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn style={{ flex: 1, background: "#0f172a", color: "#fff", borderColor: "#0f172a", justifyContent: "center" }} onClick={() => setReceiptBill(null)}>New Sale</Btn>
              <Btn variant="primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => printReceipt(receiptBill)}>Print Receipt</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

