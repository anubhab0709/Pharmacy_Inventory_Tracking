import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "Other" },
    quantity: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    batchNo: { type: String }, // renamed from batchNumber to match UI
    manufacturer: { type: String },
    price: { type: Number },
    threshold: { type: Number, default: 20 },
    unit: { type: String, default: "Tablets" },
    dateAdded: { type: Date, default: Date.now },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);