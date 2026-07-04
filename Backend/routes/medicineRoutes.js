import express from "express";
import {
  getMedicines,
  getMedicineById,
  getMedicineByBarcode,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/",    getMedicines);
router.get("/barcode/:code", getMedicineByBarcode);
router.get("/:id", getMedicineById);
router.post("/",   addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
