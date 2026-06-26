import Medicine from "../models/medicine.js";

// ➤ GET All Medicines
export const getMedicines = async (req, res) => {
  try {
    const meds = await Medicine.find();
    res.json({ success: true, data: meds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ ADD Medicine
export const addMedicine = async (req, res) => {
  try {
    const med = await Medicine.create(req.body);
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ UPDATE Medicine
export const updateMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ GET Medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ DELETE Medicine
export const deleteMedicine = async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};