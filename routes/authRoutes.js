const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  register,
  login,
  sendLoginAlert,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

router.post("/register",         register);
router.post("/signup",           register);
router.post("/login",            login);
router.post("/send-login-alert", sendLoginAlert);
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password",   resetPassword);
router.post("/change-password",  auth, changePassword);
router.get("/verify-token",      auth, (req, res) => {
  res.json({ valid: true, userId: req.userId });
});

console.log("Auth routes loaded");
module.exports = router;