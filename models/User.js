const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, unique: true, lowercase: true, trim: true },
    password:         { type: String },
    role:             { type: String, enum: ["user", "admin"], default: "user" },
    resetToken:       { type: String, default: undefined },
    resetTokenExpiry: { type: Number, default: undefined },
    lastActiveAt:     { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);