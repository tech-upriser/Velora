const axios = require("axios");
const nodemailer = require("nodemailer");

const API_KEY = process.env.GOOGLE_API_KEY;

// ─── Email transporter ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ─── Nearby emergency services via Google Places ─────────────────────────────
// GET /api/sos/nearby?lat=xx&lng=yy
exports.getNearbyEmergency = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ error: "lat and lng are required" });

    const types = [
      { type: "hospital",       label: "Hospital",     emoji: "🏥" },
      { type: "police",         label: "Police",        emoji: "👮" },
      { type: "fire_station",   label: "Fire Brigade",  emoji: "🔥" },
    ];

    const results = await Promise.all(
      types.map(async ({ type, label, emoji }) => {
        try {
          const { data } = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
              params: {
                location: `${lat},${lng}`,
                rankby: "distance",
                type,
                key: API_KEY,
              },
            }
          );

          return (data.results || []).slice(0, 3).map((p) => {
            const dlat = p.geometry.location.lat - parseFloat(lat);
            const dlng = p.geometry.location.lng - parseFloat(lng);
            const distKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
            return {
              name:    p.name,
              type:    label,
              emoji,
              address: p.vicinity || "",
              rating:  p.rating || null,
              dist:    distKm < 1
                ? `${Math.round(distKm * 1000)} m`
                : `${distKm.toFixed(1)} km`,
              phone:   p.formatted_phone_number || null,
              placeId: p.place_id,
            };
          });
        } catch {
          return [];
        }
      })
    );

    const flat = results.flat().sort((a, b) => {
      const toM = (s) => {
        if (!s) return 99999;
        const n = parseFloat(s);
        return s.includes("km") ? n * 1000 : n;
      };
      return toM(a.dist) - toM(b.dist);
    });

    res.json({ services: flat });
  } catch (err) {
    console.error("getNearbyEmergency error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── SOS email alert ─────────────────────────────────────────────────────────
// POST /api/sos/alert  body: { name, email, lat, lng, city }
exports.sendSosAlert = async (req, res) => {
  try {
    const { name, email, lat, lng, city } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const mapsLink = lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

    const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await transporter.sendMail({
      from: `"Velora SOS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🚨 SOS ALERT — Velora Emergency",
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a0a0f;padding:40px;max-width:520px;margin:auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="background:#E8341A;border-radius:10px;padding:10px 18px;font-size:26px;">🚨</span>
            <h1 style="color:#fff;font-size:22px;margin-top:12px;">SOS ALERT</h1>
          </div>
          <div style="background:rgba(232,52,26,0.12);border:1px solid rgba(232,52,26,0.4);border-radius:12px;padding:20px;margin-bottom:20px;">
            <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 8px;">
              ${name || "A Velora user"} has triggered an SOS alert!
            </p>
            <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;">Time: ${timeStr} IST</p>
            ${city ? `<p style="color:rgba(255,255,255,0.65);font-size:14px;margin:4px 0 0;">Location: ${city}</p>` : ""}
          </div>
          ${mapsLink ? `
          <div style="text-align:center;margin:24px 0;">
            <a href="${mapsLink}" style="display:inline-block;padding:14px 32px;background:#E8341A;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              📍 View Live Location
            </a>
          </div>` : ""}
          <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;margin-top:28px;">
            © 2025 Velora. This is an automated emergency alert.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: "SOS alert sent successfully" });
  } catch (err) {
    console.error("sendSosAlert error:", err.message);
    res.status(500).json({ error: "Failed to send SOS alert" });
  }
};
