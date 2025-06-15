// routes/platformFeeRoutes.js

const express = require("express");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const platformFeeRoutes = express.Router();

const { getPlatformFeeByType, upsertPlatformFee, getAllPlatformFees } = require("../controllers/platformFeeController");

platformFeeRoutes.route("/platform-fee").post(AdminProtect, upsertPlatformFee);
platformFeeRoutes.route("/get-fee/:type").get(protect, getPlatformFeeByType);
platformFeeRoutes.route("/getAllPlatformFees").get(AdminProtect, getAllPlatformFees);

module.exports = { platformFeeRoutes };
