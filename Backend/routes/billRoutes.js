import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createBill, getBills } from "../controllers/billController.js";

const router = express.Router();

router.use(authenticate);

router.get("/",  getBills);
router.post("/", createBill);

export default router;