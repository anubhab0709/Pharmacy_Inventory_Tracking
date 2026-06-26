import express from "express";
import {
  getStockOuts,
  addStockOut,
  deleteStockOut,
} from "../controllers/stockOutController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "pharmacist", "viewer"), getStockOuts);
router.post("/", authorize("admin", "pharmacist"), addStockOut);
router.delete("/:id", authorize("admin"), deleteStockOut);

export default router;
