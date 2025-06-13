const Order = require("../models/Order");

const checkPlatformFeePaid = async (req, res, next) => {
  try {
     const user_id = req.headers.userId;
    const { hire_id, hire_type, service_provider_id } = req.body;

    if (!user_id || !hire_id || !hire_type || !service_provider_id) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const isPaid = await Order.findOne({
      user_id,
      hire_id,
      hire_type,
      service_provider_id,
      type: "platform_fee",
      payment_status: "success",
    });

    if (!isPaid) {
      return res.status(403).json({
        message: "Access denied. Platform fee not paid for this service provider.",
      });
    }

    // Allow access if paid
    next();
  } catch (err) {
    console.error("Error in platform fee middleware:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkPlatformFeePaid;
