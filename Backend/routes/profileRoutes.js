import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "pharmacist", "viewer"), getProfile);
router.put("/", authorize("admin", "pharmacist", "viewer"), updateProfile);

export default router;
