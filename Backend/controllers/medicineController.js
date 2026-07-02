import Medicine from "../models/medicine.js";

const buildOwnershipQuery = (req, adminOnly = false) => {
  if (adminOnly || req.user?.role === "admin") return { _id: req.params.id };
  return { _id: req.params.id, ownerId: req.user?.id };
};

// ➤ GET All Medicines
export const getMedicines = async (req, res) => {
  try {
    const query = req.user?.role === "admin" ? {} : { ownerId: req.user?.id };
    const meds = await Medicine.find(query);
    res.json({ success: true, data: meds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ ADD Medicine
export const addMedicine = async (req, res) => {
  try {
    const med = await Medicine.create({ ...req.body, ownerId: req.user?.id });
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ UPDATE Medicine
export const updateMedicine = async (req, res) => {
  try {
    const { ownerId, ...updates } = req.body;
    const query = buildOwnershipQuery(req);
    const med = await Medicine.findOneAndUpdate(query, updates, {
      new: true,
    });
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found or access denied" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ➤ GET Medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const query = buildOwnershipQuery(req);
    const med = await Medicine.findOne(query);
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
    const query = buildOwnershipQuery(req);
    const med = await Medicine.findOneAndDelete(query);
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found or access denied" });
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};