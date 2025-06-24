const DirectOrder = require("../models/DirectOrder"); // adjust the path if needed

const checkCodPaymentEligibility = async (req, res, next) => {
  try {
    const { method } = req.body;

    // Only restrict if method is 'cod'
    if (method !== "cod") {
      return next(); // ✅ Allow everything else
    }

    const userId = req.headers.userID; // Assuming userID is passed in headers

    // Find all full-paid orders by this user
    const orders = await DirectOrder.find({
      user_id: userId,
      "service_payment.type": "full",
    });

    let onlineFullCount = 0;

    for (const order of orders) {
      const allOnline = order.service_payment.payment_history.every(
        (p) => p.method === "online" && p.status === "success"
      );
      if (allOnline) {
        onlineFullCount++;
      }
    }

    if (onlineFullCount >= 5) {
      return next(); // ✅ Eligible for COD stage
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. You must complete at least 5 fully successful online payments before creating a COD payment stage. You have only completed ${onlineFullCount}.`,
      });
    }
  } catch (err) {
    console.error("Error in COD eligibility check:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while validating COD payment eligibility.",
    });
  }
};

module.exports = checkCodPaymentEligibility;
