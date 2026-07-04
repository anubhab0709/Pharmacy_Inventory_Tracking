import Medicine from "../models/medicine.js";

// ➤ GET All Medicines
export const getMedicines = async (req, res) => {
  try {
    const meds = await Medicine.find({ ownerId: req.user.id });
    res.json({ success: true, data: meds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ GET Medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const med = await Medicine.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ GET Medicine by Barcode
export const getMedicineByBarcode = async (req, res) => {
  try {
    const med = await Medicine.findOne({ barcode: req.params.code, ownerId: req.user.id });
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found for this barcode" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ ADD Medicine
export const addMedicine = async (req, res) => {
  try {
    const med = await Medicine.create({ ...req.body, ownerId: req.user.id });
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ UPDATE Medicine
export const updateMedicine = async (req, res) => {
  try {
    const { ownerId, ...updates } = req.body; // strip ownerId from client payload
    const med = await Medicine.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      updates,
      { new: true }
    );
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found or access denied" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE Medicine
export const deleteMedicine = async (req, res) => {
  try {
    const med = await Medicine.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found or access denied" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};