import express from "express";
import {
  getStockOuts,
  addStockOut,
  deleteStockOut,
} from "../controllers/stockOutController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/",      getStockOuts);
router.post("/",     addStockOut);
router.delete("/:id", deleteStockOut);

export default router;
