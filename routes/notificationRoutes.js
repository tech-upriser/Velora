const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const auth = require("../middleware/auth");
const {
    getNotifications,
    markRead,
    markAllRead
} = require("../controllers/NotificationController");


// ✅ EXISTING ROUTES
router.get("/notifications", auth, getNotifications);
router.put("/notification/:id/read", auth, markRead);
router.put("/notifications/read-all", auth, markAllRead);


// ✅ NEW ROUTE: SEND LOGIN ALERT EMAIL
router.post("/send-login-alert", async (req, res) => {
  try {
    console.log("EMAIL:", process.env.EMAIL_USER);
    console.log("PASS:", process.env.EMAIL_PASS);

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // ✅ Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // ✅ Mail content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Velora Login Alert 🚀",
      text: "You have successfully logged into your Velora account."
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Login alert email sent ✅" });

  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send email ❌" });
  }
});

module.exports = router;