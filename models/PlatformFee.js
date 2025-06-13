const mongoose = require("mongoose");

const platformFeeSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "emergency", "bidding"], required: true, unique: true },
  fee: { type: Number, required: true },
});

module.exports = mongoose.model("PlatformFee", platformFeeSchema);
