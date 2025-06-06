// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

const AdminSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  email : {type: String, required: true, unique: true},
  firebase_token : {type: String, default: null},
  password : {type: String, required:true},
  current_token: {
	  type: String,
	  default: null,
	},
  role: {
	type: String,
	enum: ["admin"],
	default: null,
  },
  timestamp: {
	  type: Date,
	  default: () => moment().tz("Asia/Kolkata").toDate(),
	},
},
{ timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
