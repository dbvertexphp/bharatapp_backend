const companyDetailsModel = require("../models/companyDetailsModel.js");
const { ContactUsEmail, ContactUsMobile } = require("../models/companyDetailsModel");

const addAboutUs = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(200).json({
      message: "Please provide content for About Us.",
      status: false,
    });
  }

  try {
    // Check if an "About Us" document already exists
    let aboutUs = await companyDetailsModel.AboutUs.findOne();

    if (aboutUs) {
      // If it exists, update the content
      aboutUs.content = content;
      await aboutUs.save();
    } else {
      // If it doesn't exist, create a new one
      aboutUs = await companyDetailsModel.AboutUs.create({
        content,
      });
    }

    res.status(201).json({ content: aboutUs.content, status: true });
  } catch (error) {
    console.error("Error adding/updating About Us:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const addTermsConditions = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(200).json({
      message: "Please provide content for Terms & Conditions.",
      status: false,
    });
  }

  try {
    // Check if a "Terms & Conditions" document already exists
    let termsConditions = await companyDetailsModel.TermsConditions.findOne();

    if (termsConditions) {
      // If it exists, update the content
      termsConditions.content = content;
      await termsConditions.save();
    } else {
      // If it doesn't exist, create a new one
      termsConditions = await companyDetailsModel.TermsConditions.create({
        content,
      });
    }

    res.status(201).json({ content: termsConditions.content, status: true });
  } catch (error) {
    console.error("Error adding/updating Terms & Conditions:", error.message);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

const addPrivacyPolicy = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(200).json({
      message: "Please provide content for Privacy Policy.",
      status: false,
    });
  }

  try {
    // Check if a Privacy Policy document already exists
    let privacyPolicy = await companyDetailsModel.PrivacyPolicy.findOne();

    if (privacyPolicy) {
      // If it exists, update the content
      privacyPolicy.content = content;
      await privacyPolicy.save();
    } else {
      // If it doesn't exist, create a new one
      privacyPolicy = await companyDetailsModel.PrivacyPolicy.create({
        content,
      });
    }

    res.status(201).json({
      content: privacyPolicy.content,
      status: true,
    });
  } catch (error) {
    console.error("Error adding/updating Privacy Policy:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const getAboutUs = async (req, res) => {
  try {
    const aboutUs = await companyDetailsModel.AboutUs.findOne();
    if (!aboutUs) {
      return res
        .status(404)
        .json({ message: "About Us not found", status: false });
    }
    res.json({ content: aboutUs.content, status: true });
  } catch (error) {
    console.error("Error getting About Us:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const getTermsConditions = async (req, res) => {
  try {
    const termsConditions = await companyDetailsModel.TermsConditions.findOne();
    if (!termsConditions) {
      return res.status(404).json({
        message: "Terms & Conditions not found",
        status: false,
      });
    }
    res.json({ content: termsConditions.content, status: true });
  } catch (error) {
    console.error("Error getting Terms & Conditions:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

const getPrivacyPolicy = async (req, res) => {
  try {
    const privacyPolicy = await companyDetailsModel.PrivacyPolicy.findOne();
    if (!privacyPolicy) {
      return res.status(404).json({
        message: "Privacy Policy not found",
        status: false,
      });
    }
    res.json({ content: privacyPolicy.content, status: true });
  } catch (error) {
    console.error("Error getting Privacy Policy:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

// Submit Email Form
const submitEmailForm = async (req, res) => {
  try {
    const { subject, email, message } = req.body;
    const data = await ContactUsEmail.create({ subject, email, message });
    res
      .status(201)
      .json({ success: true, message: "Email form submitted", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Mobile Form
const submitMobileForm = async (req, res) => {
  try {
    const { subject, mobile_number, message } = req.body;
    const data = await ContactUsMobile.create({
      subject,
      mobile_number,
      message,
    });
    res
      .status(201)
      .json({ success: true, message: "Mobile form submitted", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Email Queries
const getEmailQueries = async (req, res) => {
  try {
    const data = await ContactUsEmail.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Mobile Queries
const getMobileQueries = async (req, res) => {
  try {
    const data = await ContactUsMobile.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Email Query
const deleteEmailQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactUsEmail.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Email query not found" });
    res.status(200).json({ success: true, message: "Email query deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Mobile Query
const deleteMobileQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactUsMobile.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Mobile query not found" });
    res.status(200).json({ success: true, message: "Mobile query deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
