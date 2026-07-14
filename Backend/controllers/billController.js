import Bill from "../models/bill.js";
import Medicine from "../models/medicine.js";

const billNumberFor = async (ownerId) => {
  const count = await Bill.countDocuments({ ownerId });
  return `BL-${String(count + 1).padStart(5, "0")}`;
};

const clampMoney = (n) => Number(Number(n || 0).toFixed(2));

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ ownerId: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBill = async (req, res) => {
  const adjusted = []; // { id, quantity } for atomic rollback
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ success: false, message: "At least one bill item is required" });
    }

    // Aggregate quantities per medicine to prevent duplicate-line oversell
    const qtyByMedicine = new Map();
    for (const item of items) {
      const medicineId = String(item.medicineId || item.id || "");
      const quantity = Number(item.quantity);
      if (!medicineId || !quantity || quantity <= 0 || !Number.isFinite(quantity)) {
        return res.status(400).json({ success: false, message: "Each bill row needs a medicine and valid quantity" });
      }
      qtyByMedicine.set(medicineId, (qtyByMedicine.get(medicineId) || 0) + quantity);
    }

    // Validate stock once per medicine (aggregated)
    const medicineCache = new Map();
    for (const [medicineId, needed] of qtyByMedicine.entries()) {
      const medicine = await Medicine.findOne({ _id: medicineId, ownerId: req.user.id });
      if (!medicine) {
        return res.status(404).json({ success: false, message: "Medicine not found" });
      }
      if ((medicine.quantity || 0) < needed) {
        return res.status(400).json({
          success: false,
          message: `Only ${medicine.quantity} units available for ${medicine.name}`,
        });
      }
      if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date(new Date().toDateString())) {
        return res.status(400).json({
          success: false,
          message: `${medicine.name} is expired and cannot be sold`,
        });
      }
      medicineCache.set(medicineId, medicine);
    }

    // Build line items using SERVER prices (ignore underpriced client values)
    const billItemsPayload = [];
    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    const useClientTax = req.body.useCustomTax === true;
    const customCgst = Number(req.body.customCgst);
    const customSgst = Number(req.body.customSgst);

    for (const item of items) {
      const medicineId = String(item.medicineId || item.id);
      const quantity = Number(item.quantity);
      const medicine = medicineCache.get(medicineId);
      const unitPrice = Number(medicine.price || 0);
      const lineTotal = clampMoney(unitPrice * quantity);
      const cgstRate = useClientTax && Number.isFinite(customCgst) ? customCgst : Number(medicine.cgst || 0);
      const sgstRate = useClientTax && Number.isFinite(customSgst) ? customSgst : Number(medicine.sgst || 0);
      cgstAmount += lineTotal * (cgstRate / 100);
      sgstAmount += lineTotal * (sgstRate / 100);
      subtotal += lineTotal;

      billItemsPayload.push({
        medicineId: medicine._id,
        medicineName: medicine.name,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    // Atomic stock deduction — fail if concurrent sale already reduced stock
    for (const [medicineId, needed] of qtyByMedicine.entries()) {
      const updated = await Medicine.findOneAndUpdate(
        { _id: medicineId, ownerId: req.user.id, quantity: { $gte: needed } },
        { $inc: { quantity: -needed } },
        { new: true }
      );
      if (!updated) {
        // Rollback previous deducts
        for (const prev of adjusted) {
          await Medicine.updateOne({ _id: prev.id }, { $inc: { quantity: prev.quantity } });
        }
        const med = medicineCache.get(medicineId);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${med?.name || "medicine"} (concurrent sale)`,
        });
      }
      adjusted.push({ id: medicineId, quantity: needed });
    }

    const finalSubtotal = clampMoney(subtotal);
    const finalCgst = clampMoney(cgstAmount);
    const finalSgst = clampMoney(sgstAmount);
    const taxAmount = clampMoney(finalCgst + finalSgst);

    // Optional discount (POS): percentage or flat amount, capped
    let discount = 0;
    const discountPct = Number(req.body.discountPercent);
    const discountAmt = Number(req.body.discountAmount);
    if (Number.isFinite(discountPct) && discountPct > 0) {
      discount = clampMoney(finalSubtotal * Math.min(discountPct, 100) / 100);
    } else if (Number.isFinite(discountAmt) && discountAmt > 0) {
      discount = clampMoney(Math.min(discountAmt, finalSubtotal + taxAmount));
    }

    const taxableAfterDiscount = clampMoney(Math.max(0, finalSubtotal - discount));
    // Recompute tax proportionally if discount applied on subtotal
    const taxScale = finalSubtotal > 0 ? taxableAfterDiscount / finalSubtotal : 1;
    const adjCgst = clampMoney(finalCgst * taxScale);
    const adjSgst = clampMoney(finalSgst * taxScale);
    const adjTax = clampMoney(adjCgst + adjSgst);
    const grandTotal = clampMoney(taxableAfterDiscount + adjTax);

    const billNo = await billNumberFor(req.user.id);

    const bill = await Bill.create({
      billNo,
      ownerId: req.user.id,
      customerName: req.body.customerName || "",
      pharmacyName: req.body.pharmacyName || "",
      pharmacyAddress: req.body.pharmacyAddress || "",
      pharmacyPhone: req.body.pharmacyPhone || "",
      pharmacyEmail: req.body.pharmacyEmail || "",
      items: billItemsPayload,
      subtotal: finalSubtotal,
      cgstAmount: adjCgst,
      sgstAmount: adjSgst,
      taxAmount: adjTax,
      grandTotal,
      date: req.body.date || new Date(),
      notes: req.body.notes || "",
    });

    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    for (const prev of adjusted) {
      try {
        await Medicine.updateOne({ _id: prev.id }, { $inc: { quantity: prev.quantity } });
      } catch {
        // secondary
      }
    }
    res.status(400).json({ success: false, message: err.message || "Failed to create bill" });
  }
};
