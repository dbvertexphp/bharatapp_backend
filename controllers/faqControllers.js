const { Faq } = require("../models/Faq");


// Create FAQ
exports.createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const faq = new Faq({ question, answer });
    await faq.save();
    res.status(201).json({ success: true, message: "FAQ added successfully", data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All FAQs
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFaq = await Faq.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFaq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ updated successfully", data: updatedFaq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Faq.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
