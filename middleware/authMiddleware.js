const asyncHandler = require("express-async-handler");
const  User  = require("../models/User.js");
const jwt = require("jsonwebtoken");
const {
  isTokenBlacklisted,
  blacklistToken,
} = require("../config/generateToken.js"); // Adjust path if needed

const mongoose = require('mongoose');  // Add mongoose to handle ObjectId

const protect = asyncHandler(async (req, res, next) => {
  let token;

  try {
    // Check if token is provided in the authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];

      // Check if the token is blacklisted
      if (isTokenBlacklisted(token)) {
        return res.status(200).json({
          message: "Token is expired or blacklisted",
          status: false,
          expired: true,
        });
      }

			// console.log("token", token);
      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded token:", decoded);  // Debugging line

      // Find the user by ID from the decoded token
      const user = await User.findById(decoded.id);
      // console.log("User from database:", user);  // Debugging line

      // Check if the user exists and if the current token matches
      if (!user) {
        return res.status(401).json({
          message: "User not found.",
          status: false,
        });
      }

			if (!user.active) {
        return res.status(403).json({
          message: "Admin has disabled your account. Please contact admin.",
          status: false,
        });
      }

      if (user.current_token !== token) {
        return res.status(401).json({
          message: "Session expired or logged in on another device",
          status: false,
          expired: true,
        });
      }
      req.user = user;
      req.headers.userID = decoded.id;
      req.headers.role = user.role;
      next();
    } else {
      res.status(401).json({
        message: "Not authorized, no token",
        status: false,
      });
    }
  } catch (error) {
    console.error("Protect middleware error:", error.message); // Log error message
    res.status(401).json({
      message: "Not authorized, token failed",
      status: false,
    });
  }
});

module.exports = protect;
