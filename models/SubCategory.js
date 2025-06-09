const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkCategory",
    required: true
  },
  image: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);
