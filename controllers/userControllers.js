const http = require("https");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const baseURL = process.env.BASE_URL;
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const cookie = require("cookie");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const path = require("path");
// const sendEmail = require("../utils/emailSender");
const argon2 = require("argon2");
const { generateToken, blacklistToken } = require("../config/generateToken.js");

const User = require("../models/User.js");

function generateOTP() {
  const min = 1000; // Minimum 4-digit number
  const max = 9999; // Maximum 4-digit number

  // Generate a random number between min and max (inclusive)
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString(); // Convert the number to a string
}

const registerUser = async (req, res) => {
  const { phone, firebase_token } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ status: false, message: "Phone number is required" });
  }

  const otp = generateOTP();
  let user = await User.findOne({ phone });

  if (user) {
    user.otp = otp;
    user.firebase_token = firebase_token;
  } else {
    user = new User({ phone, otp, firebase_token });
  }

  await user.save();

  // TODO: Send OTP via SMS here

  res.status(200).json({
    status: true,
    message: "OTP sent successfully",
    temp_otp: otp, // remove in production
  });
};

const verifyOtp = async (req, res) => {
  const { phone, entered_otp } = req.body;

  const user = await User.findOne({ phone });

  if (!user || user.otp !== entered_otp) {
    return res.status(401).json({ status: false, message: "Invalid OTP" });
  }
  const token = generateToken(user._id);

  user.current_token = token;
  user.otp = null; // clear otp
  await user.save();

  res.status(200).json({
    status: true,
    message: "OTP verified",
    token,
    isProfileComplete: user.isProfileComplete, // true = login, false = registration
  });
};

const resendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ status: false, message: "Phone number is required" });
  }

  const user = await User.findOne({ phone });

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  const otp = generateOTP(); // Re-generate OTP
  user.otp = otp;
  await user.save();

  // TODO: Send OTP via SMS (e.g. MSG91)

  res.status(200).json({
    status: true,
    message: "OTP resent successfully",
    temp_otp: otp, // Only for testing
  });
};

const updateUserProfile = async (req, res) => {
  const userId = req.headers.userID; // comes from JWT middleware
  const {
    full_name,
    role,
    location,
    current_location,
    address,
    landmark,
    colony_name,
    gali_number,
    referral_code,
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  user.full_name = full_name;
  user.role = role;
  user.location = location;
  user.current_location = current_location;
  user.address = address;
  user.landmark = landmark;
  user.colony_name = colony_name;
  user.gali_number = gali_number;
  user.referral_code = referral_code;
  user.isProfileComplete = true;

  await user.save();

  res.status(200).json({
    status: true,
    message: "Profile updated successfully",
    user,
  });
};

// const addReviewToUser = async (req, res) => {
//   try {
// 		const reviewerId = req.headers.userID;
//     const { targetUserId, review, rating } = req.body;

//     if (!targetUserId || !reviewerId || !review || !rating) {
//       return res.status(400).json({ status: false, message: "Missing fields" });
//     }

//     // Fetch the target user (the one receiving the review)
//     const targetUser = await User.findById(targetUserId);
//     if (!targetUser) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Prevent duplicate reviews (optional)
//     const alreadyReviewed = targetUser.rateAndReviews.find(
//       (r) => r.user_id.toString() === reviewerId
//     );
//     if (alreadyReviewed) {
//       return res.status(400).json({ status: false, message: "User already reviewed" });
//     }

//     // Add review to array
//     targetUser.rateAndReviews.push({
//       user_id: reviewerId,
//       review,
//       rating,
//     });

//     // Save the updated user
//     await targetUser.save();

//     res.status(200).json({
//       status: true,
//       message: "Review added successfully",
//       data: {
//         totalReview: targetUser.totalReview, // from virtual
//         rating: targetUser.rating,           // from virtual
//         rateAndReviews: targetUser.rateAndReviews,
//       },
//     });
//   } catch (error) {
//     console.error("Error adding review:", error);
//     res.status(500).json({ status: false, message: "Server error" });
//   }
// };

const addReviewToServiceProvider = async (req, res, next) => {
  req.uploadPath = "uploads/review"; // target folder

  upload.array("images", 5)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }
   console.log("req", req.body)
    try {
      const { serviceProviderId, review, rating } = req.body;
      const reviewerId = req.headers.userID;

      if (!serviceProviderId || !review || !rating) {
        return res
          .status(400)
          .json({ status: false, message: "Missing required fields" });
      }

      const serviceProvider = await User.findById(serviceProviderId);
      if (!serviceProvider || serviceProvider.role !== "service_provider") {
        return res
          .status(404)
          .json({ status: false, message: "Service provider not found" });
      }

      const alreadyReviewed = serviceProvider.rateAndReviews.find(
        (r) => r.user_id.toString() === reviewerId.toString()
      );
      if (alreadyReviewed) {
        return res
          .status(400)
          .json({
            status: false,
            message: "You already reviewed this provider.",
          });
      }

      const imagePaths =
        req.files?.map((file) => `${req.uploadPath}/${file.filename}`) || [];

      serviceProvider.rateAndReviews.push({
        user_id: reviewerId,
        review,
        rating,
        images: imagePaths,
      });

      await serviceProvider.save();

      res.status(200).json({
        status: true,
        message: "Review submitted successfully",
        data: {
          totalReview: serviceProvider.totalReview, // virtual field
          rating: serviceProvider.rating, // virtual field
          rateAndReviews: serviceProvider.rateAndReviews,
        },
      });
    } catch (err) {
      console.error("Error adding review to service provider:", err);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  });
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  addReviewToServiceProvider,
};
