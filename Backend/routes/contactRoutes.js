import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { submitContactMessage } from "../controllers/contactController.js";

const router = Router();

router.post("/", authenticate, submitContactMessage);

export default router;
