import Disposal from "../models/disposal.js";
import Medicine from "../models/medicine.js";

// ➤ GET All Disposals
export const getDisposals = async (req, res) => {
  try {
    const disposals = await Disposal.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: disposals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ ADD Disposal (Deduct + Record)
export const addDisposal = async (req, res) => {
  let med;
  try {
    const { medicineId, quantity, reason, notes, disposedBy } = req.body;

    if (!medicineId) return res.status(400).json({ success: false, message: "Medicine is required" });
    if (!reason)     return res.status(400).json({ success: false, message: "Disposal reason is required" });

    med = await Medicine.findOne({ _id: medicineId, ownerId: req.user.id });
    if (!med) return res.status(404).json({ success: false, message: "Medicine not found" });

    const numericQty = Number(quantity);
    if (!numericQty || numericQty <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than zero" });
    }
    if (med.quantity < numericQty) {
      return res.status(400).json({ success: false, message: `Only ${med.quantity} units available in stock` });
    }

    // Deduct stock
    med.quantity -= numericQty;
    await med.save();

    const disposal = await Disposal.create({
      medicineId:   med._id,
      medicineName: med.name,
      batchNo:      med.batchNo || med.batchNumber || "",
      quantity:     numericQty,
      reason:       reason,
      notes:        notes || "",
      disposedBy:   disposedBy || "Staff",
      ownerId:      req.user.id,
    });

    res.json({ success: true, data: disposal });
  } catch (err) {
    // Best-effort rollback
    if (med) {
      try {
        med.quantity += Number(req.body.quantity || 0);
        await med.save();
      } catch { /* ignore rollback failure */ }
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE Disposal (admin only, does NOT restore stock)
export const deleteDisposal = async (req, res) => {
  try {
    const deleted = await Disposal.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Disposal record not found or access denied" });
    }
    res.json({ success: true, message: "Disposal record deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
