const express = require("express");
const {
  createWorkCategory,
  getAllWorkCategories,
  updateWorkCategory,
  deleteWorkCategory,
} = require("../controllers/workCategoryController.js");
const { AdminProtect, protect } = require("../middleware/authMiddleware.js");

const workCategoryRoutes = express.Router();

workCategoryRoutes
  .route("/work-category")
  .post(AdminProtect, createWorkCategory);
workCategoryRoutes
  .route("/adminWork-category")
  .get(AdminProtect, getAllWorkCategories);
workCategoryRoutes.route("/work-category").get(protect, getAllWorkCategories);
workCategoryRoutes
  .route("/work-category/:id")
  .put(AdminProtect, updateWorkCategory);
workCategoryRoutes
  .route("/work-category/:id")
  .delete(AdminProtect, deleteWorkCategory);

module.exports = { workCategoryRoutes };
