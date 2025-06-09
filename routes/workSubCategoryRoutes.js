const express = require("express");
const {
createSubCategory,
getAllSubWorkCategories,
getSubCategoriesByCategoryId,
updateSubCategory,
deleteSubCategory,
} = require("../controllers/workSubCategoryController.js");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");


const workSubCategoryRoutes = express.Router();

workSubCategoryRoutes.route("/sub-category").post(AdminProtect, createSubCategory);
workSubCategoryRoutes.route("/sub-category").get(AdminProtect, getAllSubWorkCategories);
workSubCategoryRoutes.route("/adminSubcategories/:category_id").get(AdminProtect, getSubCategoriesByCategoryId);
workSubCategoryRoutes.route("/subcategories/:id").put(AdminProtect, updateSubCategory);
workSubCategoryRoutes.route("/subcategories/:id").delete(AdminProtect, deleteSubCategory);
workSubCategoryRoutes.route("/subcategories/:category_id").get(protect, getSubCategoriesByCategoryId);


module.exports = { workSubCategoryRoutes };
