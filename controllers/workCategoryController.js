// Controller
const WorkCategory = require('../models/WorkCategory');
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const path = require("path");



const createWorkCategory = async (req, res, next) => {
  req.uploadPath = "uploads/category";

  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const { name } = req.body;

      const imagePath = req.file ? `${req.uploadPath}/${req.file.filename}` : null;

      const newCategory = new WorkCategory({
        name,
        image: imagePath,
      });

      await newCategory.save();

      const imageUrl = req.file
        ? `${req.protocol}://${req.get("host")}/${imagePath}`
        : null;

      res.status(201).json({
        _id: newCategory._id,
        name: newCategory.name,
        image: imageUrl,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

const getAllWorkCategories = async (req, res) => {
  try {
    const categories = await WorkCategory.find();

    const formattedCategories = categories.map((category) => {
      const imageUrl = category.image
        ? `${req.protocol}://${req.get("host")}/${category.image}`
        : null;

      return {
        _id: category._id,
        name: category.name,
        image: imageUrl,
      };
    });

    res.status(200).json({
      status: true,
      message: "All work categories fetched successfully",
      data: formattedCategories,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const updateWorkCategory = async (req, res, next) => {
  req.uploadPath = "uploads/category";

  upload.single("image")(req, res, async (err) => {
     if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const { id } = req.params;
      const { name } = req.body;

      const category = await WorkCategory.findById(id);
      if (!category) {
        return res.status(404).json({ status: false, message: "Category not found" });
      }

      // Update name
      if (name) category.name = name;

      // Replace image if new one is uploaded
      if (req.file) {
        // Delete old image from server
        if (category.image) {
          const oldImagePath = path.join(__dirname, "..", category.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Set new image path
        category.image = `${req.uploadPath}/${req.file.filename}`;
      }

      await category.save();

      const imageUrl = category.image
        ? `${req.protocol}://${req.get("host")}/${category.image}`
        : null;

      res.status(200).json({
        status: true,
        message: "Category updated successfully",
        data: {
          _id: category._id,
          name: category.name,
          image: imageUrl,
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  });
};


const deleteWorkCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await WorkCategory.findById(id);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    // Delete image from server
    if (category.image) {
      const imagePath = path.join(__dirname, "..", category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await WorkCategory.findByIdAndDelete(id);

    res.status(200).json({
      status: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


module.exports = {
	createWorkCategory,
	getAllWorkCategories,
	updateWorkCategory,
	deleteWorkCategory,
}
