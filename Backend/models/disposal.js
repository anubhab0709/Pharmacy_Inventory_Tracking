import mongoose from "mongoose";

const disposalSchema = new mongoose.Schema(
  {
    medicineId:   { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    medicineName: { type: String, required: true },
    batchNo:      { type: String, default: "" },
    quantity:     { type: Number, required: true, min: 1 },
    reason:       {
      type: String,
      required: true,
      enum: ["Expired", "Damaged", "Broken", "Returned to Distributor", "Other"],
    },
    notes:        { type: String, default: "" },
    disposedBy:   { type: String, default: "Staff" },
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Disposal", disposalSchema);
