import auth from "./auth.js";
import { Router } from "express";

const router = Router();
router.use("/auth", auth);

export default router;
