import express from "express";
import auth from "../controllers/authController.js";

const router = express.Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/forget-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/verify-otp", auth.verifyOtp);
router.post("/resend-otp", auth.resendOtp);
export default router;
