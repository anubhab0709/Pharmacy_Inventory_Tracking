import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "Other" },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    batchNo: { type: String }, // renamed from batchNumber to match UI
    manufacturer: { type: String },
    price: { type: Number, min: 0 },
    threshold: { type: Number, default: 20, min: 0 },
    unit: { type: String, default: "Tablets" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateAdded: { type: Date, default: Date.now },
    description: { type: String },
    barcode: { type: String, sparse: true },
    cgst: { type: Number, default: 0, min: 0, max: 100 },
    sgst: { type: Number, default: 0, min: 0, max: 100 },
    hsnCode: { type: String, default: "" },
  },
  { timestamps: true }
);

medicineSchema.index({ ownerId: 1, name: 1 });
medicineSchema.index({ ownerId: 1, barcode: 1 });
medicineSchema.index({ ownerId: 1, expiryDate: 1 });

export default mongoose.model("Medicine", medicineSchema);