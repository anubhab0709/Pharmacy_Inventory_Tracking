import Medicine from "../models/medicine.js";

const MEDICINE_FIELDS = [
  "name", "category", "quantity", "expiryDate", "batchNo", "batchNumber",
  "manufacturer", "price", "threshold", "unit", "description", "barcode",
  "cgst", "sgst", "hsnCode",
];

function pickMedicinePayload(body = {}) {
  const updates = {};
  for (const key of MEDICINE_FIELDS) {
    if (body[key] === undefined) continue;
    if (key.startsWith("$")) continue;
    updates[key] = body[key];
  }
  // Normalize batch field
  if (updates.batchNumber && !updates.batchNo) updates.batchNo = updates.batchNumber;
  delete updates.batchNumber;

  if (updates.quantity !== undefined) {
    updates.quantity = Number(updates.quantity);
    if (!Number.isFinite(updates.quantity) || updates.quantity < 0) {
      throw new Error("Quantity must be a non-negative number");
    }
  }
  if (updates.price !== undefined) {
    updates.price = Number(updates.price);
    if (!Number.isFinite(updates.price) || updates.price < 0) {
      throw new Error("Price must be a non-negative number");
    }
  }
  if (updates.threshold !== undefined) {
    updates.threshold = Number(updates.threshold);
    if (!Number.isFinite(updates.threshold) || updates.threshold < 0) {
      throw new Error("Threshold must be a non-negative number");
    }
  }
  for (const taxKey of ["cgst", "sgst"]) {
    if (updates[taxKey] !== undefined) {
      updates[taxKey] = Number(updates[taxKey]) || 0;
      if (updates[taxKey] < 0 || updates[taxKey] > 100) {
        throw new Error(`${taxKey.toUpperCase()} must be between 0 and 100`);
      }
    }
  }
  if (updates.name !== undefined) updates.name = String(updates.name).trim();
  if (updates.category !== undefined) {
    updates.category = String(updates.category).trim();
    if (!updates.category || updates.category === "Select category") {
      throw new Error("Valid category is required");
    }
  }
  return updates;
}

function hasOperatorKeys(obj) {
  return Object.keys(obj || {}).some((k) => k.startsWith("$"));
}

export const getMedicines = async (req, res) => {
  try {
    const meds = await Medicine.find({ ownerId: req.user.id }).sort({ name: 1 });
    res.json({ success: true, data: meds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

export const addMedicine = async (req, res) => {
  try {
    if (hasOperatorKeys(req.body)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    const payload = pickMedicinePayload(req.body);
    if (!payload.name || !payload.category || payload.quantity === undefined || !payload.expiryDate) {
      return res.status(400).json({ success: false, message: "Name, category, quantity, and expiry date are required" });
    }
    if (payload.price === undefined) {
      return res.status(400).json({ success: false, message: "Price is required" });
    }
    const med = await Medicine.create({ ...payload, ownerId: req.user.id });
    res.status(201).json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    if (hasOperatorKeys(req.body)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    const updates = pickMedicinePayload(req.body);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    const med = await Medicine.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!med) {
      return res.status(404).json({ success: false, message: "Medicine not found or access denied" });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const bulkUpdateTaxes = async (req, res) => {
  try {
    const updates = {};
    if (req.body.cgst !== undefined) {
      const cgst = Number(req.body.cgst);
      if (!Number.isFinite(cgst) || cgst < 0 || cgst > 100) {
        return res.status(400).json({ success: false, message: "CGST must be between 0 and 100" });
      }
      updates.cgst = cgst;
    }
    if (req.body.sgst !== undefined) {
      const sgst = Number(req.body.sgst);
      if (!Number.isFinite(sgst) || sgst < 0 || sgst > 100) {
        return res.status(400).json({ success: false, message: "SGST must be between 0 and 100" });
      }
      updates.sgst = sgst;
    }
    if (req.body.hsnCode !== undefined) updates.hsnCode = String(req.body.hsnCode).trim();
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No tax fields provided" });
    }
    await Medicine.updateMany({ ownerId: req.user.id }, { $set: updates });
    const meds = await Medicine.find({ ownerId: req.user.id });
    res.json({ success: true, data: meds, message: "Taxes updated on all medicines" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

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
