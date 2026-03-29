const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-login-alert", async (req, res) => {
  try {
    const { email, name } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Login Alert 🚨",
      text: "New login detected in your Velora account."
    });

    res.status(200).json({ message: "Email sent successfully" });

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;