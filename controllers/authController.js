require("dotenv").config();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const SECRET = process.env.JWT_SECRET;

// ─── EMAIL TRANSPORTER ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── EMAIL HTML WRAPPER ──────────────────────────────────────────────
const emailWrapper = (content) => `
  <div style="font-family: Arial, sans-serif; background: #0a0a0f; padding: 40px;
    max-width: 520px; margin: auto; border-radius: 16px;">
    <div style="text-align:center; margin-bottom: 28px;">
      <span style="background:#e8622a; border-radius:10px; padding:10px 18px; font-size:22px;">✈️</span>
      <h1 style="color:white; font-size:22px; margin-top:12px;">Velora</h1>
    </div>
    ${content}
    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:28px 0;" />
    <p style="text-align:center; color:rgba(255,255,255,0.3); font-size:12px;">
      © 2025 Velora. All rights reserved.
    </p>
  </div>
`;

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
    res.json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ SEND LOGIN SECURITY ALERT EMAIL
exports.sendLoginAlert = async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  try {
    await transporter.sendMail({
      from: `"Velora Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 New Sign-In to Your Velora Account",
      html: emailWrapper(`
        <h2 style="color:#e8622a;">New Sign-In Detected</h2>
        <p style="color:rgba(255,255,255,0.7); font-size:15px; line-height:1.6;">
          Hi <strong style="color:white;">${name || "Traveler"}</strong>,
          a new sign-in to your Velora account was detected.
        </p>
        <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          border-radius:12px; padding:20px; margin:20px 0;">
          <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.45);">TIME</p>
          <p style="margin:4px 0 14px; color:white;">${timeStr} IST</p>
          <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.45);">ACCOUNT</p>
          <p style="margin:4px 0 0; color:white;">${email}</p>
        </div>
        <p style="color:rgba(255,255,255,0.55); font-size:14px;">
          If this was you, no action needed. If not,
          <a href="${process.env.FRONTEND_URL}/login" style="color:#e8622a;">
            secure your account immediately
          </a>.
        </p>
      `),
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Login alert error:", err);
    res.status(500).json({ error: "Failed to send alert" });
  }
};

// ✅ FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true }); // Don't reveal if email exists

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: `"Velora" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Reset Your Velora Password",
      html: emailWrapper(`
        <h2 style="color:#e8622a;">Reset Your Password</h2>
        <p style="color:rgba(255,255,255,0.7); font-size:15px; line-height:1.6;">
          Hi <strong style="color:white;">${user.name}</strong>,
          click below to reset your password.
          This link expires in <strong style="color:white;">1 hour</strong>.
        </p>
        <div style="text-align:center; margin:28px 0;">
          <a href="${resetLink}"
            style="display:inline-block; padding:14px 32px; background:#e8622a; color:white;
            border-radius:10px; text-decoration:none; font-weight:700; font-size:15px;">
            Reset Password →
          </a>
        </div>
        <p style="color:rgba(255,255,255,0.4); font-size:13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      `),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired reset link." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
};

// ✅ CHANGE PASSWORD (logged-in users)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Current password is incorrect" });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};