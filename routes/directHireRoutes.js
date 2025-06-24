const express = require("express");
const directHireRoutes = express.Router();
const directHireController = require("../controllers/DirectHireController");
const { AdminProtect, protect } = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const checkCodPaymentEligibility  = require("../middleware/checkUserOnlineFullPayments.js");

directHireRoutes.route("/create").post(protect, Authorization(["user"]), directHireController.createDirectOrder);
directHireRoutes.route("/verify-platform-payment").post(protect, Authorization(["user"]), directHireController.verifyPlatformPayment);
directHireRoutes.route("/reject-offer").post(protect, Authorization(["service_provider"]), directHireController.rejectOffer);
directHireRoutes.route("/send-next-offer").post(protect, Authorization(["user"]), directHireController.sendToNextProvider);
directHireRoutes.route("/accept-offer").post(protect, Authorization(["service_provider"]), directHireController.acceptOffer);
directHireRoutes.route("/completeOrderProvider").post(protect, Authorization(["service_provider"]), directHireController.completeOrderServiceProvider);
directHireRoutes.route("/completeOrderUser").post(protect, Authorization(["user"]), directHireController.completeOrderUser);
// Order Payments

directHireRoutes.route("/order/:orderId/payment-stage").post(protect, Authorization(["user"]),checkCodPaymentEligibility, directHireController.addPaymentStage);
directHireRoutes.route("/order/:orderId/pay").post(protect, Authorization(["user"]), directHireController.makeServicePayment);
directHireRoutes.route("/getAllDirectOrders").get(AdminProtect, directHireController.getAllDirectOrders);
directHireRoutes.route("/apiGetAllDirectOrders").get(protect, directHireController.getAllDirectOrdersApi);
directHireRoutes.route("/getDirectOrderWithWorker/:id").get(directHireController.getDirectOrderWithWorker);


module.exports = { directHireRoutes };

