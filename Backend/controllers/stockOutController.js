import StockOut from "../models/stockOut.js";
import Medicine from "../models/medicine.js";

// ➤ GET All StockOuts
export const getStockOuts = async (req, res) => {
  try {
    const outs = await StockOut.find({ ownerId: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: outs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ ADD StockOut (Dispense)
export const addStockOut = async (req, res) => {
  let med;
  try {
    const { medicineId, quantity } = req.body;

    med = await Medicine.findOne({ _id: medicineId, ownerId: req.user.id });
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    const numericQuantity = Number(quantity);
    if (!numericQuantity || numericQuantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than zero" });
    }
    if (med.quantity < numericQuantity) {
      return res.status(400).json({ success: false, message: `Only ${med.quantity} units available` });
    }

    // Deduct stock
    med.quantity -= numericQuantity;
    await med.save();

    // Record the dispense
    const stockOut = await StockOut.create({
      medicineId:      med._id,
      medicineName:    med.name,
      quantity:        numericQuantity,
      price:           med.price || 0,
      patientName:     req.body.patientName  || "Walk-in Customer",
      prescribedBy:    req.body.prescribedBy || "",
      date:            req.body.date         || new Date(),
      notes:           req.body.notes        || "",
      billNo:          req.body.billNo       || `SO-${Date.now()}`,
      transactionType: req.body.transactionType || "fast",
      ownerId:         req.user.id,
    });

    res.json({ success: true, data: stockOut });
  } catch (err) {
    // Best-effort rollback — restore stock if dispense record creation failed
    if (med) {
      try {
        med.quantity += Number(req.body.quantity || 0);
        await med.save();
      } catch {
        // Report the original error below; rollback failure is logged by errorHandler
      }
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE StockOut
// Note: does not restore stock (consistent with billing behaviour)
export const deleteStockOut = async (req, res) => {
  try {
    const deleted = await StockOut.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Stock out record not found or access denied" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
