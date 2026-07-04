import Profile from "../models/profile.js";

export function shopInitials(shopName = "") {
  return shopName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "RX";
}

export async function syncPharmacyProfile({ userId, shopName, ownerName, email, phone }) {
  const data = {
    pharmacyName: shopName,
    ownerName,
    email,
    phone,
    avatar: shopInitials(shopName),
    registeredSince: new Date().getFullYear().toString(),
  };

  let profile = await Profile.findOne({ ownerId: userId });
  if (!profile) {
    profile = await Profile.create({ ...data, ownerId: userId });
  } else {
    profile = await Profile.findByIdAndUpdate(profile._id, data, { new: true });
  }
  return profile;
}
