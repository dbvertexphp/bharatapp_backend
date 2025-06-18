const express = require("express");
const directHireRoutes = express.Router();
const directHireController = require("../controllers/DirectHireController");
const { AdminProtect, protect } = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");

directHireRoutes.route("/create").post(protect, Authorization(["user"]), directHireController.createDirectOrder);
directHireRoutes.route("/verify-platform-payment").post(protect, Authorization(["user"]), directHireController.verifyPlatformPayment);
directHireRoutes.route("/reject-offer").post(protect, Authorization(["service_provider"]), directHireController.rejectOffer);
directHireRoutes.route("/send-next-offer").post(protect, Authorization(["user"]), directHireController.sendToNextProvider);
directHireRoutes.route("/accept-offer").post(protect, Authorization(["service_provider"]), directHireController.acceptOffer);

// Order Payments

directHireRoutes.route("/order/:orderId/payment-stage").post(protect, Authorization(["user"]), directHireController.addPaymentStage);
directHireRoutes.route("/order/:orderId/pay").post(protect, Authorization(["user"]), directHireController.makeServicePayment);


module.exports = { directHireRoutes };

