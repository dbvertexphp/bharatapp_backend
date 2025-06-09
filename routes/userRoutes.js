const express = require("express");
const {protect} = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const userRoutes = express.Router();
const {
	registerUser,
	verifyOtp,
	resendOtp,
	updateUserProfile,
	addReviewToServiceProvider,
} = require("../controllers/userControllers.js");

userRoutes.route("/register").post(registerUser);
userRoutes.route("/verifyOtp").post(verifyOtp);
userRoutes.route("/resend-otp").post(resendOtp);
userRoutes.route("/updateUserProfile").put(protect, updateUserProfile);
userRoutes.route("/add-review").post(protect, Authorization(["user"]), addReviewToServiceProvider);


module.exports = { userRoutes };
