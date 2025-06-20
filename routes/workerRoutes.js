const express = require("express");
const workerRoutes = express.Router();
const workerController = require("../controllers/workerController");
const Authorization = require("../middleware/Authorization.middleware.js");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");


workerRoutes.route("/add").post(protect, Authorization(["service_provider", "both"]), workerController.addWorker);
workerRoutes.route("/edit/:id").put(protect, Authorization(["service_provider", "both"]), workerController.editWorker);
workerRoutes.route("/delete/:id").delete(protect, Authorization(["service_provider", "both"]), workerController.deleteWorker);
workerRoutes.route("/get/:id").get(protect, Authorization(["service_provider", "both"]), workerController.getSingleWorker);
workerRoutes.route("/all").get(protect, Authorization(["service_provider", "both"]), workerController.getAllWorkersByServiceProvider);
workerRoutes.route("/assign-order").post(protect, Authorization(["service_provider", "both"]), workerController.assignOrderToWorker);


module.exports = { workerRoutes };
