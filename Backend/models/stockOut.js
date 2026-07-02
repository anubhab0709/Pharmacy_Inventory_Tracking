import mongoose from "mongoose";

const stockOutSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true, default: 0 },
    patientName: { type: String, default: "Walk-in Customer" },
    prescribedBy: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    billNo: { type: String, required: true, default: () => `SO-${Date.now()}` },
    transactionType: { type: String, enum: ["fast", "dispense"], default: "fast" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("StockOut", stockOutSchema);
