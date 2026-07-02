import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { createBill, getBills } from "../controllers/billController.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "pharmacist", "viewer"), getBills);
router.post("/", authorize("admin", "pharmacist"), createBill);

export default router;