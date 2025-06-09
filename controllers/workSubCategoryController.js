// Controller
const SubCategory = require('../models/SubCategory');
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const path = require("path");


const createSubCategory = async (req, res, next) => {
  // Set dynamic upload path
  req.uploadPath = "uploads/subcategory";

  // Use multer upload middleware with dynamic path
  upload.single("image")(req, res, async (err) => {
     if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const { name, category_id } = req.body;

      const imagePath = req.file ? `${req.uploadPath}/${req.file.filename}` : null;

      const subCategory = new SubCategory({
        name,
        category_id,
        image: imagePath,
      });

      await subCategory.save();

      const imageUrl = req.file
        ? `${req.protocol}://${req.get("host")}/${imagePath}`
        : null;

      res.status(201).json({
        status: true,
        message: "Sub category created",
        data: {
          _id: subCategory._id,
          name: subCategory.name,
          category_id: subCategory.category_id,
          image: imageUrl,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

const getAllSubWorkCategories = async (req, res) => {
	try {
		const categories = await SubCategory.find();

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
			message: "All Sub work categories fetched successfully",
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

const getSubCategoriesByCategoryId = async (req, res) => {
  try {
    const { category_id } = req.params; 

    if (!category_id) {
      return res.status(400).json({
        status: false,
        message: "category_id is required",
      });
    }

    const subCategories = await SubCategory.find({ category_id });

    const formatted = subCategories.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      category_id: sub.category_id,
      image: sub.image
        ? `${req.protocol}://${req.get("host")}/${sub.image}`
        : null,
    }));

    res.status(200).json({
      status: true,
      message: "Subcategories fetched successfully",
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


const updateSubCategory = async (req, res, next) => {
  req.uploadPath = "uploads/subcategory";

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
      const { name, category_id } = req.body;

      const subCategory = await SubCategory.findById(id);
      if (!subCategory) {
        return res.status(404).json({ status: false, message: "Sub category not found" });
      }

      // Update fields
      if (name) subCategory.name = name;
      if (category_id) subCategory.category_id = category_id;

      // Handle image update
      if (req.file) {
        // Delete old image
        if (subCategory.image) {
          const oldImagePath = path.join(__dirname, "..", subCategory.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Save new image
        const imagePath = `${req.uploadPath}/${req.file.filename}`;
        subCategory.image = imagePath;
      }

      await subCategory.save();

      const imageUrl = subCategory.image
        ? `${req.protocol}://${req.get("host")}/${subCategory.image}`
        : null;

      res.status(200).json({
        status: true,
        message: "Sub category updated",
        data: {
          _id: subCategory._id,
          name: subCategory.name,
          category_id: subCategory.category_id,
          image: imageUrl,
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  });
};


const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({ status: false, message: "Sub category not found" });
    }

    // Delete image from server
    if (subCategory.image) {
      const imagePath = path.join(__dirname, "..", subCategory.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await SubCategory.findByIdAndDelete(id);

    res.status(200).json({
      status: true,
      message: "Sub category and image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



module.exports = {
createSubCategory,
getAllSubWorkCategories,
getSubCategoriesByCategoryId,
updateSubCategory,
deleteSubCategory,
}
