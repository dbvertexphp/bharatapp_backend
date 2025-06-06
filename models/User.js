// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,

  // User Info
  full_name: { type: String, default: null },
  location: { type: String, default: null },
  current_location: { type: String, default: null },
  full_address: { type: String, default: null },
  landmark: { type: String, default: null },
  colony_name: { type: String, default: null },
  gali_number: { type: String, default: null },
  referral_code:  { type: String, default: null },
	firebase_token:  { type: String, default: null },
	profile_pic: {
      type: String,
    },
	active: { type: Boolean, default: true },
  current_token: {
      type: String,
      default: null,
    },
	isProfileComplete:{ type: Boolean, default: false},
  // Role (default: 'user')
  role: {
    type: String,
    enum: ["user", "business"],
    default: null,
  },
  timestamp: {
      type: Date,
      default: () => moment().tz("Asia/Kolkata").toDate(),
    },
},
{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
