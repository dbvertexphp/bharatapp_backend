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

const Admin = require("../models/Admin.js");
const  User  = require("../models/User.js");

exports.registerAdmin = async (req, res) => {
  try {
    const { phone, email, full_name, password } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ message: "Phone or email is required" });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      phone,
      email,
      full_name,
      role: "admin",
      current_token: null,
    });

    // Save manually hashed password
    admin.password = hashedPassword;

    await admin.save();

    return res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Admin (with phone or email)
exports.loginAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be phone or email

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    const admin = await Admin.findOne({
      $or: [{ phone: identifier }, { email: identifier }]
    });

    if (!admin || !admin.password) {
      return res.status(404).json({ message: "Admin not found or password not set" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(admin._id);

    admin.current_token = token;
    await admin.save();

    return res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        full_name: admin.full_name,
        phone: admin.phone,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.adminAllDashboardCount = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSeller,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "service_provider" })
    ]);
    return res.json({
      success: true,
      data: {
        totalUsers,
        totalSeller,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = {
      role: "user",
      $or: [
        { full_name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.getAllServiceProvider = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = {
      role: "service_provider",
      $or: [
        { full_name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const { userId, active } = req.body;
  // console.log("req", req.body);

  if (!userId || typeof active !== "boolean") {
    return next(
      new ErrorHandler("User ID and active status are required.", 400)
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  user.active = active;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${active ? "enabled" : "disabled"} successfully.`,
    user: {
      _id: user._id,
      full_name: user.full_name,
      active: user.active,
    },
  });
};

exports.updateUserverified = async (req, res, next) => {
  const { userId, verified } = req.body;
  // console.log("req", req.body);

  if (!userId || typeof verified !== "boolean") {
    return next(
      new ErrorHandler("User ID and active status are required.", 400)
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  user.verified = verified;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${verified ? "enabled" : "disabled"} successfully.`,
    user: {
      _id: user._id,
      full_name: user.full_name,
      verified: user.verified,
    },
  });
};
