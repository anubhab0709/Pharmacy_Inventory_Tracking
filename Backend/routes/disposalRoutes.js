import express from "express";
import { getDisposals, addDisposal, deleteDisposal } from "../controllers/disposalController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/",       getDisposals);
router.post("/",      addDisposal);
router.delete("/:id", deleteDisposal);

export default router;
