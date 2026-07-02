import Bill from "../models/bill.js";
import Medicine from "../models/medicine.js";

const buildMedicineQuery = (req, medicineId) => {
  if (req.user?.role === "admin") return { _id: medicineId };
  return { _id: medicineId, ownerId: req.user?.id };
};

const billNumberFor = async (ownerId, fallbackPrefix = "BL") => {
  const count = await Bill.countDocuments(ownerId ? { ownerId } : {});
  return `${fallbackPrefix}-${String(count + 1).padStart(5, "0")}`;
};

export const getBills = async (req, res) => {
  try {
    const query = req.user?.role === "admin" ? {} : { ownerId: req.user?.id };
    const bills = await Bill.find(query).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBill = async (req, res) => {
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
      const quantity = Number(item.quantity);
      if (!medicineId || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each bill row needs a medicine and quantity" });
      }

      const medicine = await Medicine.findOne(buildMedicineQuery(req, medicineId));
      if (!medicine) {
        return res.status(404).json({ success: false, message: "Medicine not found" });
      }
      if ((medicine.quantity || 0) < quantity) {
        return res.status(400).json({ success: false, message: `Only ${medicine.quantity} units available for ${medicine.name}` });
      }

      const unitPrice = Number(item.unitPrice ?? medicine.price ?? 0);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineTotal;

      billItems.push({
        medicineId: medicine._id,
        medicineName: medicine.name,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    for (const item of billItems) {
      const medicine = await Medicine.findOne(buildMedicineQuery(req, item.medicineId));
      if (!medicine) continue;
      medicine.quantity -= item.quantity;
      await medicine.save();
      adjustedMedicines.push({ medicineId: medicine._id, quantity: item.quantity });
    }

    const billNo = req.body.billNo || await billNumberFor(req.user?.id);
    const bill = await Bill.create({
      billNo,
      ownerId: req.user?.id,
      customerName: req.body.customerName || "",
      pharmacyName: req.body.pharmacyName || "",
      pharmacyAddress: req.body.pharmacyAddress || "",
      pharmacyPhone: req.body.pharmacyPhone || "",
      pharmacyEmail: req.body.pharmacyEmail || "",
      items: billItems,
      subtotal: Number(subtotal.toFixed(2)),
      grandTotal: Number(Number(req.body.grandTotal ?? subtotal).toFixed(2)),
      date: req.body.date || new Date(),
      notes: req.body.notes || "",
    });

    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    for (const adjustment of adjustedMedicines) {
      try {
        const medicine = await Medicine.findOne(buildMedicineQuery(req, adjustment.medicineId));
        if (!medicine) continue;
        medicine.quantity += adjustment.quantity;
        await medicine.save();
      } catch {
        // Best-effort rollback; the original error is still reported below.
      }
    }
    res.status(400).json({ success: false, message: err.message });
  }
};