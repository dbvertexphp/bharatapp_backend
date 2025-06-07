const mongoose = require("mongoose");
// Schema for About Us
const faqSchema = new mongoose.Schema({
  question: {
	type: String,
	required: true,
  },
  answer: {
	type: String,
	required: true,
  }
});

exports.Faq = mongoose.model("Faq", faqSchema);

