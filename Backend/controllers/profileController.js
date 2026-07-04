import Profile from "../models/profile.js";
import { shopInitials } from "../utils/pharmacyProfile.js";

// -------------------- GET PROFILE --------------------
export const getProfile = async (req, res) => {
  try {
    const ownerId = req.user.id;

    let profile = await Profile.findOne({ ownerId });

    if (!profile) {
      profile = await Profile.create({
        ownerId,
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Fields allowed to update
const PROFILE_FIELDS = [
  "pharmacyName",
  "ownerName",
  "licenseNo",
  "drugLicense",
  "phone",
  "email",
  "address",
  "gstin",
  "registeredSince",
];

// -------------------- UPDATE PROFILE --------------------
export const updateProfile = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const payload = {};

    PROFILE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });

    if (payload.pharmacyName) {
      payload.avatar = shopInitials(payload.pharmacyName);
    }

    let profile = await Profile.findOne({ ownerId });

    if (!profile) {
      profile = await Profile.create({
        ownerId,
        ...payload,
      });
    } else {
      Object.assign(profile, payload);
      await profile.save();
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};