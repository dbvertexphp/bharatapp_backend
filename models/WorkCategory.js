const mongoose = require("mongoose");

const workCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("WorkCategory", workCategorySchema);
