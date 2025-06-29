const DirectOrder = require("../models/DirectOrder.js");
const EmergencyOrder = require("../models/EmergencyOrder.js");
const BiddingOrder = require("../models/BiddingOrder.js");
const Dispute = require("../models/Dispute.js");
const upload = require("../middleware/uploadMiddleware.js");

exports.createDispute = async (req, res) => {
  req.uploadPath = "uploads/dispute";

  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }
    // flow_type = direct / emergency / bidding
    try {
      const { order_id, flow_type, amount, description, requirement } =
        req.body;
      const image = req.file?.path;
      const raised_by = req.headers.userID;

      let order = null;
      let OrderModel = null;

      if (flow_type === "direct") {
        OrderModel = DirectOrder;
      } else if (flow_type === "emergency") {
        OrderModel = EmergencyOrder;
      } else if (flow_type === "bidding") {
        OrderModel = BiddingOrder;
      } else {
        return res.status(400).json({ message: "Invalid flow type" });
      }

      order = await OrderModel.findById(order_id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Determine who the dispute is against
      let against = null;
      let updateField = {};

      if (raised_by.toString() === order.user_id.toString()) {
        against = order.service_provider_id;
        updateField.user_status = "cancelledDispute";
      } else if (
        raised_by.toString() === order.service_provider_id.toString()
      ) {
        against = order.user_id;
        updateField.hire_status = "cancelledDispute";
      } else {
        return res
          .status(403)
          .json({ message: "You are not part of this order" });
      }

      // Update the order status based on who raised the dispute
      await OrderModel.findByIdAndUpdate(order_id, { $set: updateField });

      const dispute = new Dispute({
        order_id,
        flow_type,
        raised_by,
        against,
        amount,
        description,
        requirement,
        image,
      });

      await dispute.save();

      res.status(201).json({
        success: true,
        message: "Dispute created and order status updated",
        dispute,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error creating dispute", error });
    }
  });
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("raised_by", "full_name phone")
      .populate("against", "full_name phone");

    res.status(200).json({ success: true, disputes });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching disputes", error });
  }
};
