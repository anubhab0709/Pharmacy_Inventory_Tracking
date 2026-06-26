import mongoose from "mongoose";

const stockOutSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true },
    patientName: { type: String, required: true },
    prescribedBy: { type: String },
    date: { type: Date, default: Date.now },
    notes: { type: String },
    billNo: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("StockOut", stockOutSchema);
