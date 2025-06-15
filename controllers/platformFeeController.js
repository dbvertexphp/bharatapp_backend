// controllers/platformFeeController.js

const PlatformFee = require("../models/PlatformFee");

const upsertPlatformFee = async (req, res) => {
  try {
    const { type, fee } = req.body;

    // Validate input
    const allowedTypes = ["direct", "emergency", "bidding"];
    if (!type || fee == null) {
      return res.status(400).json({ status: false, message: "type and fee are required" });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ status: false, message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
    }

    // Upsert the document
    const updatedFee = await PlatformFee.findOneAndUpdate(
      { type },
      { $set: { fee } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      status: true,
      message: "Platform fee upserted successfully",
      data: updatedFee,
    });

  } catch (error) {
    console.error("Error in upsertPlatformFee:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


const getPlatformFeeByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ status: false, message: "hiring_type is required" });
    }

    const fee = await PlatformFee.findOne({ type });

    if (!fee) {
      return res.status(404).json({ status: false, message: "Fee not found for the given hiring type" });
    }

    return res.status(200).json({ status: true, data: fee });
  } catch (error) {
    console.error("Error in getPlatformFeeByType:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getAllPlatformFees = async (req, res) => {
  try {
    const fees = await PlatformFee.find();

    return res.status(200).json({ status: true, data: fees });
  } catch (error) {
    console.error("Error in getAllPlatformFees:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

module.exports = { upsertPlatformFee, getPlatformFeeByType, getAllPlatformFees };
