// routes/platformFeeRoutes.js

const express = require("express");
const {AdminProtect} = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const platformFeeRoutes = express.Router();

const { getPlatformFeeByType, upsertPlatformFee } = require("../controllers/platformFeeController");

platformFeeRoutes.route("/platform-fee").post(AdminProtect, upsertPlatformFee);
platformFeeRoutes.route("/get-fee/:type").get(AdminProtect, getPlatformFeeByType);

module.exports = { platformFeeRoutes };
