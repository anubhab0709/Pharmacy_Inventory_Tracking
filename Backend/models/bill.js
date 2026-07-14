import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true, default: 0 },
    lineTotal: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, default: "" },
    pharmacyName: { type: String, default: "" },
    pharmacyAddress: { type: String, default: "" },
    pharmacyPhone: { type: String, default: "" },
    pharmacyEmail: { type: String, default: "" },
    items: { type: [billItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

billSchema.index({ ownerId: 1, billNo: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);