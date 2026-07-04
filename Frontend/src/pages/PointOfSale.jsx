import React, { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../theme";
import { fmtCurrency } from "../utils";
import { Btn, Icon, PageHdr, inputSt } from "../components/SharedUI";

const makeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function PointOfSale({ medicines = [], createBill, profile = {}, toast }) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receiptBill, setReceiptBill] = useState(null);

  const videoRef = useRef(null);
  const scannerInputRef = useRef(null);
  const streamRef = useRef(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [cart]);
  const grandTotal = Math.max(0, subtotal - discount);

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
      return [{
        id: makeId(),
        medicineId: medicine.id || medicine._id,
        medicineName: medicine.name,
        quantity: 1,
        unitPrice: Number(medicine.price || 0),
        maxQuantity: medicine.quantity
      }, ...prev];
    });
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim();
    
    // Fuzzy search by barcode or name
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
      toast.error("Camera scanning is not supported in this browser. Please use a barcode scanner or type manually.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err) {
      toast.error("Failed to access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanFrame = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    // Using native BarcodeDetector API (Chrome/Edge/Android)
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128', 'upc_a'] });
      const barcodes = await barcodeDetector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        stopCamera();
        const match = medicines.find(m => m.barcode === code);
        if (match) {
          addToCart(match);
        } else {
          toast.error("Unrecognized barcode: " + code);
        }
      } else {
        if (isCameraActive) requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      if (isCameraActive) requestAnimationFrame(scanFrame);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const payload = {
        customerName: "POS Walk-in",
        notes: discount > 0 ? `Discount applied: ${fmtCurrency(discount)}` : "POS Checkout",
        pharmacyName: profile.pharmacyName || "",
        pharmacyAddress: profile.address || "",
        pharmacyPhone: profile.phone || "",
        pharmacyEmail: profile.email || "",
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        grandTotal
      };
      
      const bill = await createBill(payload);
      setReceiptBill(bill);
      setCart([]);
      setDiscount(0);
      toast.success("Checkout successful");
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const printReceipt = (bill) => {
    if (!bill) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      toast.error("Pop-up blocked. Allow pop-ups to print receipts.");
      return;
    }

    const itemsMarkup = (bill.items || []).map(item => `
      <tr>
        <td style="padding:4px 0;border-bottom:1px dashed #ccc;">${item.medicineName}<br/><small>${item.quantity} x ${item.unitPrice}</small></td>
        <td style="padding:4px 0;border-bottom:1px dashed #ccc;text-align:right;">${item.quantity * item.unitPrice}</td>
      </tr>
    `).join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${bill.billNo}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 20px; color: #000; width: 300px; }
            .center { text-align: center; }
            h2 { margin: 5px 0; font-size: 16px; }
            p { margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { border-bottom: 1px solid #000; padding-bottom: 4px; text-align: left; }
            .totals { margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body onload="window.print();">
          <div class="center">
            <h2>${profile.pharmacyName || "Pharmacy"}</h2>
            <p>${profile.address || ""}</p>
            <p>${profile.phone || ""}</p>
            <p>===============================</p>
            <p>Receipt: ${bill.billNo}</p>
            <p>Date: ${new Date(bill.date).toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:right">Total</th></tr>
            </thead>
            <tbody>${itemsMarkup}</tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Total</span><span>${fmtCurrency(bill.grandTotal)}</span></div>
          </div>
          <div class="center" style="margin-top:20px;">
            <p>Thank you for your visit!</p>
          </div>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHdr title="Point of Sale" subtitle="Scan barcodes or search to quickly checkout" icon="pos" />
      
      <div style={{ display: "flex", gap: 24, flex: 1, marginTop: 24 }}>
        
        {/* Left Side: Scanner & Search */}
        <div style={{ flex: "2", display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ background: C.surface, padding: 24, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: C.text }}>Add Item</h3>
            
            <form onSubmit={handleBarcodeSubmit} style={{ display: "flex", gap: 12 }}>
              <input
                ref={scannerInputRef}
                type="text"
                placeholder="Scan barcode or type name..."
                style={{ ...inputSt(), flex: 1, fontSize: 16, padding: "14px 16px" }}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                autoFocus
              />
              <Btn type="submit" variant="primary">Add</Btn>
              <Btn type="button" variant="outline" onClick={startCamera}>
                <Icon name="camera" size={20} /> Camera
              </Btn>
            </form>

            {isCameraActive && (
              <div style={{ marginTop: 16, position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", height: 300 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={stopCamera} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={16} />
                </button>
                <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Point camera at barcode</div>
              </div>
            )}
          </div>

          {/* Quick Add Medicine Grid */}
          <div style={{ background: C.surface, padding: 24, borderRadius: 16, border: `1px solid ${C.border}`, flex: 1, overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: C.text }}>Quick Items (Low Stock)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {medicines.slice(0, 12).map(med => (
                <button
                  key={med._id || med.id}
                  onClick={() => addToCart(med)}
                  style={{ padding: 16, background: med.quantity <= 0 ? C.bg : C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 12, cursor: med.quantity <= 0 ? "not-allowed" : "pointer", textAlign: "left", transition: "all 0.15s" }}
                  disabled={med.quantity <= 0}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{med.name}</div>
                  <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>{fmtCurrency(med.price || 0)}</div>
                  <div style={{ fontSize: 11, color: med.quantity <= 0 ? C.red : C.muted, marginTop: 8 }}>{med.quantity <= 0 ? "Out of stock" : `${med.quantity} in stock`}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cart */}
        <div style={{ flex: "1", display: "flex", flexDirection: "column", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.text }}>Current Sale</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", color: C.muted, marginTop: 40 }}>
                <Icon name="pos" size={48} color={C.border} style={{ marginBottom: 16 }} />
                <p>Cart is empty</p>
                <p style={{ fontSize: 12 }}>Scan an item to add it here</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: `1px dashed ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.medicineName}</div>
                      <div style={{ fontSize: 13, color: C.muted }}>{fmtCurrency(item.unitPrice)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                        <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} style={{ padding: "4px 8px", background: C.surfaceHover, border: "none", cursor: "pointer" }}>-</button>
                        <span style={{ padding: "0 12px", fontSize: 14 }}>{item.quantity}</span>
                        <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + 1) } : i))} style={{ padding: "4px 8px", background: C.surfaceHover, border: "none", cursor: "pointer" }}>+</button>
                      </div>
                      <div style={{ fontWeight: 600, width: 60, textAlign: "right" }}>
                        {fmtCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.red, padding: 4 }}>
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 24, borderTop: `1px solid ${C.border}`, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: C.muted }}>
              <span>Subtotal</span>
              <span>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14, color: C.muted, alignItems: "center" }}>
              <span>Discount</span>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ ...inputSt(), width: 80, padding: "4px 8px", textAlign: "right" }} min="0" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 20, fontWeight: 700, color: C.text }}>
              <span>Total</span>
              <span>{fmtCurrency(grandTotal)}</span>
            </div>
            
            <Btn variant="primary" style={{ width: "100%", padding: "16px 0", fontSize: 16 }} onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut}>
              {isCheckingOut ? "Processing..." : `Charge ${fmtCurrency(grandTotal)}`}
            </Btn>
          </div>
        </div>

      </div>

      {receiptBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, padding: 32, borderRadius: 16, width: 400, textAlign: "center" }}>
            <Icon name="check" size={48} color={C.teal} style={{ marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px 0" }}>Sale Complete!</h2>
            <p style={{ color: C.muted, marginBottom: 24 }}>Bill No: {receiptBill.billNo}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn variant="outline" style={{ flex: 1 }} onClick={() => setReceiptBill(null)}>New Sale</Btn>
              <Btn variant="primary" style={{ flex: 1 }} onClick={() => printReceipt(receiptBill)}>Print Receipt</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
