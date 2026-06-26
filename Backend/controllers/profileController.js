import Profile from "../models/profile.js";
import { shopInitials } from "../utils/pharmacyProfile.js";

// ➤ GET Profile
export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({});
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ UPDATE Profile
export const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pharmacyName) {
      payload.avatar = shopInitials(payload.pharmacyName);
    }

    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create(payload);
    } else {
      profile = await Profile.findByIdAndUpdate(profile._id, payload, { new: true });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
