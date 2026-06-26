import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    pharmacyName: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    licenseNo: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
    registeredSince: { type: String, default: "" },
    avatar: { type: String, default: "RX" },
    drugLicense: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
