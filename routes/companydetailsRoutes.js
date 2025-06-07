const express = require("express");
const {
  addAboutUs,
  addTermsConditions,
  addPrivacyPolicy,
  getAboutUs,
  getTermsConditions,
  getPrivacyPolicy,
	submitEmailForm,
	submitMobileForm,
	getEmailQueries,
	getMobileQueries,
	deleteEmailQuery,
	deleteMobileQuery,
} = require("../controllers/companyDetailsController.js");
const {AdminProtect, protect} = require("../middleware/authMiddleware.js");

const companyDetails = express.Router();
companyDetails.route("/addAboutUs").post(AdminProtect, addAboutUs);
companyDetails.route("/addTermsConditions").post(AdminProtect, addTermsConditions);
companyDetails.route("/addPrivacyPolicy").post(AdminProtect, addPrivacyPolicy);

companyDetails.route("/getAboutUs").get(getAboutUs);
companyDetails.route("/getTermsConditions").get(getTermsConditions);
companyDetails.route("/getPrivacyPolicy").get(getPrivacyPolicy);


// Submit forms
companyDetails.route("/contact/email").post(protect, submitEmailForm);
companyDetails.route("/contact/mobile").post(protect, submitMobileForm);


// Get all queries
companyDetails.route("/contact/email").get(getEmailQueries);
companyDetails.route("/contact/mobile").get(getMobileQueries);

// Delete queries

companyDetails.route("/contact/email/:id").delete(AdminProtect, deleteEmailQuery);
companyDetails.route("/contact/mobile/:id").delete(AdminProtect, deleteMobileQuery);

module.exports = { companyDetails };
