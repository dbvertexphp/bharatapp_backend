const express = require("express");
const {
createFaq,
getFaqs,
updateFaq,
deleteFaq
} = require("../controllers/faqControllers.js");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");


const faqRoutes = express.Router();

faqRoutes.route("/faq").post(AdminProtect, createFaq);
faqRoutes.route("/faq").get(AdminProtect, getFaqs);
faqRoutes.route("/userFaq").get(protect, getFaqs);
faqRoutes.route("/faq/:id").put(AdminProtect, updateFaq);
faqRoutes.route("/faq/:id").delete(AdminProtect, deleteFaq);


module.exports = { faqRoutes };
