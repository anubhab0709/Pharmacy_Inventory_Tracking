import StockOut from "../models/stockOut.js";
import Medicine from "../models/medicine.js";

const buildMedicineQuery = (req, medicineId) => {
  if (req.user?.role === "admin") return { _id: medicineId };
  return { _id: medicineId, ownerId: req.user?.id };
};

const buildStockOutQuery = (req, stockOutId) => {
  if (req.user?.role === "admin") return { _id: stockOutId };
  return { _id: stockOutId, ownerId: req.user?.id };
};

// ➤ GET All StockOuts
export const getStockOuts = async (req, res) => {
  try {
    const query = req.user?.role === "admin" ? {} : { ownerId: req.user?.id };
    const outs = await StockOut.find(query).sort({ date: -1, createdAt: -1 });
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
    
    // Check if medicine exists and has enough quantity
    med = await Medicine.findOne(buildMedicineQuery(req, medicineId));
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

    // Deduct quantity
    med.quantity -= numericQuantity;
    await med.save();

    // Record the dispense
    const stockOut = await StockOut.create({
      medicineId: med._id,
      medicineName: med.name,
      quantity: numericQuantity,
      price: med.price || 0,
      patientName: req.body.patientName || "Walk-in Customer",
      prescribedBy: req.body.prescribedBy || "",
      date: req.body.date || new Date(),
      notes: req.body.notes || "",
      billNo: req.body.billNo || `SO-${Date.now()}`,
      transactionType: req.body.transactionType || "fast",
      ownerId: req.user?.id,
    });

    res.json({ success: true, data: stockOut });
  } catch (err) {
    if (med) {
      try {
        med.quantity += Number(req.body.quantity || 0);
        await med.save();
      } catch {
        // Best-effort rollback; report the original error below.
      }
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE StockOut (Note: typically doesn't restore stock in this logic based on UI specs)
export const deleteStockOut = async (req, res) => {
  try {
    const deleted = await StockOut.findOneAndDelete(buildStockOutQuery(req, req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Stock out record not found or access denied" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
