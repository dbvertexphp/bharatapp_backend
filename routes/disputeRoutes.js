const express = require("express");
const {
createDispute,
getAllDisputes,

} = require("../controllers/disputeController.js");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");


const disputeRoutes = express.Router();

disputeRoutes.route("/create").post(protect, createDispute);
disputeRoutes.route("/getAll").get(protect, getAllDisputes);



module.exports = { disputeRoutes };
