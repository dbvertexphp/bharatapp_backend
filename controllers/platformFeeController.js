// controllers/platformFeeController.js

const PlatformFee = require("../models/PlatformFee");

const upsertPlatformFee = async (req, res) => {
  try {
    const { type, fee } = req.body;

    if (!type || fee == null) {
      return res.status(400).json({ status: false, message: "hiring_type and fee_amount are required" });
    }

    const updatedFee = await PlatformFee.findOneAndUpdate(
      { type },
      { fee },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ status: true, message: "Fee upserted successfully", data: updatedFee });
  } catch (error) {
    console.error("Error in upsertPlatformFee:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
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

module.exports = { upsertPlatformFee, getPlatformFeeByType };
