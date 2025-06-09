// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

// Subschema for review and rating
const reviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  review: { type: String, required: true },
  rating: { type: Number, required: true },
  images: [{ type: String }], // Array of image URLs or file paths
  createdAt: { type: Date, default: Date.now },
});


const userSchema = new mongoose.Schema(
  {
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
    referral_code: { type: String, default: null },
    firebase_token: { type: String, default: null },
    profile_pic: { type: String },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    current_token: { type: String, default: null },
    isProfileComplete: { type: Boolean, default: false },

    // Role
    role: {
      type: String,
      enum: ["user", "service_provider", "both"],
      default: null,
    },

    // New Fields
    hiswork: [{ type: String }],
    skill: { type: String },
    rateAndReviews: [reviewSchema],
    documents: { type: String },

    timestamp: {
      type: Date,
      default: () => moment().tz("Asia/Kolkata").toDate(),
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for totalReview count
userSchema.virtual("totalReview").get(function () {
  return this.rateAndReviews?.length || 0;
});

// Virtual for average rating
userSchema.virtual("rating").get(function () {
  if (!this.rateAndReviews || this.rateAndReviews.length === 0) return 0;
  const total = this.rateAndReviews.reduce((sum, r) => sum + r.rating, 0);
  return (total / this.rateAndReviews.length).toFixed(1);
});

module.exports = mongoose.model("User", userSchema);
