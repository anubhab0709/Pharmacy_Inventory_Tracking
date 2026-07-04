import Bill from "../models/bill.js";
import Medicine from "../models/medicine.js";

const billNumberFor = async (ownerId) => {
  const count = await Bill.countDocuments({ ownerId });
  return `BL-${String(count + 1).padStart(5, "0")}`;
};

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ ownerId: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBill = async (req, res) => {
  // Track medicines we deducted so we can roll back on failure
  const adjustedMedicines = [];
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ success: false, message: "At least one bill item is required" });
    }

    const billItems = [];
    let subtotal = 0;

    for (const item of items) {
      const medicineId = item.medicineId || item.id;
      const quantity   = Number(item.quantity);

      if (!medicineId || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each bill row needs a medicine and quantity" });
      }

      // Single fetch per medicine — validate and prepare in one pass
      const medicine = await Medicine.findOne({ _id: medicineId, ownerId: req.user.id });
      if (!medicine) {
        return res.status(404).json({ success: false, message: "Medicine not found" });
      }
      if ((medicine.quantity || 0) < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${medicine.quantity} units available for ${medicine.name}`,
        });
      }

      const unitPrice = Number(item.unitPrice ?? medicine.price ?? 0);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineTotal;

      billItems.push({ medicine, quantity, unitPrice, lineTotal });
    }

    // Deduct stock for all validated items
    for (const { medicine, quantity, unitPrice, lineTotal } of billItems) {
      medicine.quantity -= quantity;
      await medicine.save();
      adjustedMedicines.push({ medicine, quantity });
    }

    // Build the bill items payload for storage
    const billItemsPayload = billItems.map(({ medicine, quantity, unitPrice, lineTotal }) => ({
      medicineId:   medicine._id,
      medicineName: medicine.name,
      quantity,
      unitPrice,
      lineTotal,
    }));

    const billNo = req.body.billNo || await billNumberFor(req.user.id);
    const bill = await Bill.create({
      billNo,
      ownerId:         req.user.id,
      customerName:    req.body.customerName    || "",
      pharmacyName:    req.body.pharmacyName    || "",
      pharmacyAddress: req.body.pharmacyAddress || "",
      pharmacyPhone:   req.body.pharmacyPhone   || "",
      pharmacyEmail:   req.body.pharmacyEmail   || "",
      items:           billItemsPayload,
      subtotal:        Number(subtotal.toFixed(2)),
      grandTotal:      Number(Number(req.body.grandTotal ?? subtotal).toFixed(2)),
      date:            req.body.date || new Date(),
      notes:           req.body.notes || "",
    });

    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    // Best-effort rollback — restore stock for any medicine already deducted
    for (const { medicine, quantity } of adjustedMedicines) {
      try {
        medicine.quantity += quantity;
        await medicine.save();
      } catch {
        // Rollback failure is secondary; report the original error below
      }
    }
    res.status(400).json({ success: false, message: err.message });
  }
};