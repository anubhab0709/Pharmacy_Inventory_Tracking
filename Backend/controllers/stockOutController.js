import StockOut from "../models/stockOut.js";
import Medicine from "../models/medicine.js";

// ➤ GET All StockOuts
export const getStockOuts = async (req, res) => {
  try {
    const outs = await StockOut.find().sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: outs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ ADD StockOut (Dispense)
export const addStockOut = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    
    // Check if medicine exists and has enough quantity
    const med = await Medicine.findById(medicineId);
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    
    if (med.quantity < quantity) {
      return res.status(400).json({ success: false, message: `Only ${med.quantity} units available` });
    }

    // Deduct quantity
    med.quantity -= quantity;
    await med.save();

    // Record the dispense
    const stockOut = await StockOut.create({
      ...req.body,
      medicineName: med.name
    });

    res.json({ success: true, data: stockOut });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE StockOut (Note: typically doesn't restore stock in this logic based on UI specs)
export const deleteStockOut = async (req, res) => {
  try {
    await StockOut.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
