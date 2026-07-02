import express from "express";
import {
  getMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "pharmacist", "viewer"), getMedicines);
router.get("/:id", authorize("admin", "pharmacist", "viewer"), getMedicineById);
router.post("/", authorize("admin", "pharmacist"), addMedicine);
router.put("/:id", authorize("admin", "pharmacist"), updateMedicine);
router.delete("/:id", authorize("admin", "pharmacist"), deleteMedicine);

export default router;
