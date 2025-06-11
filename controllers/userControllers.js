const http = require("https");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const baseURL = process.env.BASE_URL;
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const cookie = require("cookie");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const path = require("path");
// const sendEmail = require("../utils/emailSender");
const argon2 = require("argon2");
const { generateToken, blacklistToken } = require("../config/generateToken.js");

const User = require("../models/User.js");
const WorkCategory = require("../models/WorkCategory");
const SubCategory = require("../models/SubCategory");

function generateOTP() {
  const min = 1000; // Minimum 4-digit number
  const max = 9999; // Maximum 4-digit number

  // Generate a random number between min and max (inclusive)
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString(); // Convert the number to a string
}

const registerUser = async (req, res) => {
  const { phone, firebase_token } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ status: false, message: "Phone number is required" });
  }

  const otp = generateOTP();
  let user = await User.findOne({ phone });

  if (user) {
    user.otp = otp;
    user.firebase_token = firebase_token;
  } else {
    user = new User({ phone, otp, firebase_token });
  }

  await user.save();

  // TODO: Send OTP via SMS here

  res.status(200).json({
    status: true,
    message: "OTP sent successfully",
    temp_otp: otp, // remove in production
  });
};

const verifyOtp = async (req, res) => {
  const { phone, entered_otp } = req.body;

  const user = await User.findOne({ phone });

  if (!user || user.otp !== entered_otp) {
    return res.status(401).json({ status: false, message: "Invalid OTP" });
  }
  const token = generateToken(user._id);

  user.current_token = token;
  user.otp = null; // clear otp
  await user.save();

  res.status(200).json({
    status: true,
    message: "OTP verified",
    token,
    isProfileComplete: user.isProfileComplete, // true = login, false = registration
  });
};

const resendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ status: false, message: "Phone number is required" });
  }

  const user = await User.findOne({ phone });

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  const otp = generateOTP(); // Re-generate OTP
  user.otp = otp;
  await user.save();

  // TODO: Send OTP via SMS (e.g. MSG91)

  res.status(200).json({
    status: true,
    message: "OTP resent successfully",
    temp_otp: otp, // Only for testing
  });
};

const updateUserProfile = async (req, res) => {
  const userId = req.headers.userID; // comes from JWT middleware
  const {
    full_name,
    role,
    location,
    current_location,
    address,
    landmark,
    colony_name,
    house_number,
    referral_code,
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  user.full_name = full_name;
  user.role = role;
  user.location = location;
  user.current_location = current_location;
  user.full_address = address;
  user.landmark = landmark;
  user.colony_name = colony_name;
  user.house_number = house_number;
  user.referral_code = referral_code;
  user.isProfileComplete = true;

  await user.save();

  res.status(200).json({
    status: true,
    message: "Profile updated successfully",
    user,
  });
};

const addReviewToServiceProvider = async (req, res, next) => {
  req.uploadPath = "uploads/review"; // target folder

  upload.array("images", 5)(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }
    console.log("req", req.body);
    try {
      const { serviceProviderId, review, rating } = req.body;
      const reviewerId = req.headers.userID;

      if (!serviceProviderId || !review || !rating) {
        return res
          .status(400)
          .json({ status: false, message: "Missing required fields" });
      }

      const serviceProvider = await User.findById(serviceProviderId);
      if (!serviceProvider || serviceProvider.role !== "service_provider") {
        return res
          .status(404)
          .json({ status: false, message: "Service provider not found" });
      }

      const alreadyReviewed = serviceProvider.rateAndReviews.find(
        (r) => r.user_id.toString() === reviewerId.toString()
      );
      if (alreadyReviewed) {
        return res.status(400).json({
          status: false,
          message: "You already reviewed this provider.",
        });
      }

      const imagePaths =
        req.files?.map((file) => `${req.uploadPath}/${file.filename}`) || [];

      serviceProvider.rateAndReviews.push({
        user_id: reviewerId,
        review,
        rating,
        images: imagePaths,
      });

      await serviceProvider.save();

      res.status(200).json({
        status: true,
        message: "Review submitted successfully",
        data: {
          totalReview: serviceProvider.totalReview, // virtual field
          rating: serviceProvider.rating, // virtual field
          rateAndReviews: serviceProvider.rateAndReviews,
        },
      });
    } catch (err) {
      console.error("Error adding review to service provider:", err);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  });
};

const updateUserDetails = async (req, res) => {
  req.uploadPath = "uploads/document";

  upload.single("document")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const userId = req.headers.userID; // Case-sensitive, ensure client sends 'userID'
      const { category_id, subcategory_ids, skill } = req.body;

      // Prepare documents field with uploaded file path
      let documents = [];
      if (req.file) {
        documents = req.file.path; // Store the path of the uploaded file
      }

      // Parse and validate subcategory_ids
      let parsedSubcategoryIds = [];
      if (subcategory_ids) {
        try {
          // If subcategory_ids is a string, parse it as JSON
          parsedSubcategoryIds =
            typeof subcategory_ids === "string"
              ? JSON.parse(subcategory_ids)
              : subcategory_ids;

          // Ensure it's an array
          if (!Array.isArray(parsedSubcategoryIds)) {
            return res.status(400).json({
              status: false,
              message: "subcategory_ids must be an array",
            });
          }

          // Validate each ID as a valid ObjectId
          for (const id of parsedSubcategoryIds) {
            if (!mongoose.isValidObjectId(id)) {
              return res.status(400).json({
                status: false,
                message: `Invalid ObjectId in subcategory_ids: ${id}`,
              });
            }
          }
        } catch (parseError) {
          console.error("Parse error for subcategory_ids:", parseError);
          return res.status(400).json({
            status: false,
            message:
              "Invalid format for subcategory_ids. Expected a JSON array of valid ObjectIds",
          });
        }
      }

      // Update user details
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          category_id,
          subcategory_ids: parsedSubcategoryIds, // Use parsed and validated array
          skill,
          documents,
        },
        { new: true } // Returns the updated document
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      res.status(200).json({
        status: true,
        message: "User details updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  });
};

// const updateProfilePic = async (req, res) => {
//    req.uploadPath = "uploads/profile";

//   upload.single("profilePic")(req, res, async (err) => {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(400).json({
//         status: false,
//         message: err.message || "File upload failed",
//       });
//     }

//     try {
//       const userId = req.headers.userID; // Case-sensitive, ensure client sends 'userID'

//       // Check if file was uploaded
//       if (!req.file) {
//         return res.status(400).json({
//           status: false,
//           message: "No profile picture uploaded",
//         });
//       }

//       // Update user with new profile picture path
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         {
//           profile_pic: req.file.path, // Store the file path in the profilePic field
//         },
//         { new: true } // Returns the updated document
//       );

//       if (!updatedUser) {
//         return res.status(404).json({
//           status: false,
//           message: "User not found",
//         });
//       }

//       res.status(200).json({
//         status: true,
//         message: "Profile picture updated successfully",
//         data: updatedUser,
//       });
//     } catch (error) {
//       console.error("Update error:", error);
//       res.status(500).json({
//         status: false,
//         message: "Internal server error",
//       });
//     }
//   });
// };

const updateProfilePic = async (req, res) => {
  req.uploadPath = "uploads/profile";

  upload.single("profilePic")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const userId = req.headers.userID; // Case-sensitive, ensure client sends 'userID'

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "No profile picture uploaded",
        });
      }

      // Find the user to get the current profile picture path
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
      if (req.file) {
        // Delete old image from server
        if (user.profile_pic) {
          const oldProfilePic = path.join(__dirname, "..", user.profile_pic);
          if (fs.existsSync(oldProfilePic)) {
            fs.unlinkSync(oldProfilePic);
          }
        }
      }
      // Update user with new profile picture path
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profile_pic: req.file.path, // Store the new file path
        },
        { new: true } // Returns the updated document
      );

      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        status: true,
        message: "Profile picture updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  });
};

const updateHisWork = async (req, res) => {
  req.uploadPath = "uploads/hiswork";

  upload.array("hiswork")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const userId = req.headers.userID; // Case-sensitive, ensure client sends 'userID'

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: false,
          message: "No images uploaded for hiswork",
        });
      }

      // Find the user to get the current hiswork image paths
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      // Prepare new hiswork array with uploaded file paths
      const newHisWork = req.files.map((file) => file.path);

      // Update user with new hiswork image paths
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          hiswork: newHisWork, // Replace old array with new file paths
        },
        { new: true } // Returns the updated document
      );

      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
      res.status(200).json({
        status: true,
        message: "Hiswork images updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  });
};


const getUserProfileData = async (req, res) => {
  try {
    const userId = req.headers.userID; // Case-sensitive, ensure client sends 'userID'

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Dynamic base URL: use environment variable or construct from request
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Normalize path slashes (replace \ with /)
    const normalizePath = (path) => (path ? path.replace(/\\/g, "/") : path);

    // Fetch category name
    let category_name = null;
    if (user.category_id) {
      const category = await WorkCategory.findById(user.category_id);
      category_name = category ? category.name : null;
    }

    // Fetch subcategory names
    let subcategory_names = [];
    if (user.subcategory_ids && user.subcategory_ids.length > 0) {
      const subcategories = await SubCategory.find({
        _id: { $in: user.subcategory_ids },
      });
      subcategory_names = subcategories.map((sub) => sub.name);
    }

    // Add dynamic URL to image paths
    const profilePicWithUrl = user.profile_pic
      ? `${baseUrl}/${normalizePath(user.profile_pic)}`
      : null;
    const hisworkWithUrl = user.hiswork
      ? user.hiswork.map((path) => `${baseUrl}/${normalizePath(path)}`)
      : [];
    const rateAndReviewsWithUrl = user.rateAndReviews
      ? user.rateAndReviews.map((review) => ({
          user_id: review.user_id,
          review: review.review,
          rating: review.rating,
          images: review.images
            ? review.images.map((path) => `${baseUrl}/${normalizePath(path)}`)
            : [],
          _id: review._id,
          createdAt: review.createdAt,
        }))
      : [];

    const customerReview = user.rateAndReviews
      ? user.rateAndReviews.map((review) => ({
          images: review.images
            ? review.images.map((path) => `${baseUrl}/${normalizePath(path)}`)
            : [],
        }))
      : [];

    // Combine user profile data
    const profileData = {
      _id: user._id,
      phone: user.phone,
      full_name: user.full_name,
      location: user.location,
      current_location: user.current_location,
      full_address: user.full_address,
      landmark: user.landmark,
      colony_name: user.colony_name,
      gali_number: user.gali_number,
      referral_code: user.referral_code,
      active: user.active,
      isProfileComplete: user.isProfileComplete,
      role: user.role,
      verified: user.verified,
      category_id: user.category_id,
      category_name: category_name,
      subcategory_ids: user.subcategory_ids,
      subcategory_names: subcategory_names,
      skill: user.skill,
      profilePic: profilePicWithUrl,
      hiswork: hisworkWithUrl,
      rateAndReviews: rateAndReviewsWithUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      customerReview: customerReview,
      totalReview: user.totalReview, // virtual field
      rating: user.rating, // virtual field
			bankdetail : user.bankdetails,
    };

    res.status(200).json({
      status: true,
      message: "User profile data retrieved successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching user profile data:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const getServiceProvidersByCategoryAndSubcategory = async (req, res) => {
  try {
    const { category_id, subcategory_id } = req.body;

    if (!category_id || !subcategory_id) {
      return res.status(400).json({ status: false, message: "category_id and subcategory_id are required" });
    }

    const serviceProviders = await User.find({
      role: "service_provider",
      active: true,
			verified: true,
			isProfileComplete: true,
      category_id: new mongoose.Types.ObjectId(category_id),
      subcategory_ids: new mongoose.Types.ObjectId(subcategory_id),
    });

    res.status(200).json({
      status: true,
      message: "Service providers fetched successfully",
      data: serviceProviders,
    });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const updateBankDetails = async (req, res) => {
  try {
   const userId = req.headers.userID;
    const {
      accountNumber,
      accountHolderName,
      bankName,
      ifscCode,
      upiId,
    } = req.body;

    // Construct bank details object
    const bankDetails = {
      accountNumber,
      accountHolderName,
      bankName,
      ifscCode,
      upiId,
    };

    // Update user with new bank details (replace or add)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bankdetails: bankDetails },
      { new: true, upsert: false } // upsert false since user must already exist
    );

    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    res.status(200).json({
      status: true,
      message: "Bank details updated successfully",
      data: updatedUser.bankdetails,
    });
  } catch (error) {
    console.error("Error updating bank details:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  updateUserProfile,
  addReviewToServiceProvider,
  updateUserDetails,
  updateProfilePic,
  updateHisWork,
  getUserProfileData,
	getServiceProvidersByCategoryAndSubcategory,
	updateBankDetails,
};
