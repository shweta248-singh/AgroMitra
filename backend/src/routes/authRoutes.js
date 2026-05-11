import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
 import { protect } from "../middleware/authMiddleware.js";
import { googleLogin } from "../controllers/authController.js";
import { verifyOTP } from "../controllers/authController.js";
import {registerSeller } from "../controllers/authController.js";

const router = express.Router();

router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

router.post("/register", registerUser);
router.post("/register-seller", registerSeller); 
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/google", googleLogin);



export default router;
