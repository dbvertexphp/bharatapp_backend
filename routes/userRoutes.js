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
	updateUserDetails,
	updateProfilePic,
	updateHisWork,
	getUserProfileData,
getServiceProvidersByCategoryAndSubcategory,
updateBankDetails,
getServiceProvider

} = require("../controllers/userControllers.js");

userRoutes.route("/register").post(registerUser);
userRoutes.route("/verifyOtp").post(verifyOtp);
userRoutes.route("/resend-otp").post(resendOtp);
userRoutes.route("/updateUserProfile").put(protect, updateUserProfile);
userRoutes.route("/add-review").post(protect, Authorization(["user", "both"]), addReviewToServiceProvider);
userRoutes.route("/updateUserDetails").put(protect, updateUserDetails);
userRoutes.route("/updateProfilePic").put(protect, updateProfilePic);
userRoutes.route("/updateHisWork").put(protect, Authorization(["service_provider", "both"]), updateHisWork);
userRoutes.route("/getUserProfileData").get(protect, getUserProfileData);
userRoutes.route("/getServiceProviders").post(protect, Authorization(["user", "both"]), getServiceProvidersByCategoryAndSubcategory);
userRoutes.route("/updateBankDetails").put(protect, updateBankDetails);
userRoutes.route("/getServiceProvider/:id").get(getServiceProvider);

module.exports = { userRoutes };
