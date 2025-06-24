const express = require("express");
const {AdminProtect} = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const adminRoutes = express.Router();
const {
	registerAdmin,
	loginAdmin,
	adminAllDashboardCount,
	getAllUsers,
	updateUserStatus,
	getAllServiceProvider,
	updateUserverified,
	getServiceProvider
} = require("../controllers/adminController.js");

adminRoutes.route("/register").post(registerAdmin);
adminRoutes.route("/login").post(loginAdmin);
adminRoutes.route("/adminAllDashboardCount").get(AdminProtect, Authorization(["admin"]), adminAllDashboardCount);
adminRoutes.route("/getAllUsers").get(AdminProtect, Authorization(["admin"]), getAllUsers);
adminRoutes.route("/getAllServiceProvider").get(AdminProtect, Authorization(["admin"]), getAllServiceProvider);
adminRoutes.route("/updateUserStatus").patch(AdminProtect, Authorization(["admin"]), updateUserStatus);
adminRoutes.route("/updateUserverified").patch(AdminProtect, Authorization(["admin"]), updateUserverified);
adminRoutes.route("/getServiceProvider/:id").get( getServiceProvider);



module.exports = { adminRoutes };
