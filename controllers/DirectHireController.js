const Razorpay = require("razorpay");
const crypto = require("crypto");
const DirectOrder = require("../models/DirectOrder.js");
const PlatformFee = require("../models/PlatformFee.js");
const razorpay = require("../config/razorpay.js");
const upload = require("../middleware/uploadMiddleware.js");
const Worker = require("../models/worker");
const mongoose = require("mongoose");
const User = require("../models/User.js");

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

exports.createDirectOrder = async (req, res) => {
  req.uploadPath = "uploads/directOrder";

  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const user_id = req.headers.userID;
      // console.log("uuuu", user_id);
      const user = await User.findById(user_id);
      if (user.active === false) {
        return res
          .status(403)
          .json({ message: "User is deactivated. Please Contact to Admin" });
      }

      const { title, description, address, deadline, first_provider_id } =
        req.body;
      const platformAmount = await PlatformFee.findOne({ type: "direct" });
      if (!platformAmount) {
        return res.status(400).json({ message: "Platform fee not configured" });
      }

      const image_url = req.file
        ? "/uploads/directOrder/" + req.file.filename
        : null;

      const amountInPaise = platformAmount.fee * 100;
      console.log("amountInPaise", amountInPaise);

      // Create Razorpay Order
      const razorOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `platform_fee_${Date.now()}`,
        payment_capture: 1,
      });

      // Save DirectOrder
      // Generate random 7-digit project_id
      const project_id = "#" + Math.floor(1000000 + Math.random() * 9000000); // ensures 7 digits

      const order = await DirectOrder.create({
        user_id,
        title,
        description,
        address,
        deadline,
        image_url,
        project_id,
        offer_history: [
          {
            provider_id: first_provider_id,
            status: "pending",
          },
        ],
        hire_status: "pending",
        platform_fee: platformAmount.fee,
        razorOrderIdPlatform: razorOrder.id,
      });

      return res.status(201).json({
        message: "Direct order created. Proceed to payment.",
        razorpay_order: razorOrder,
        order,
      });
    } catch (error) {
      console.error("Direct order creation failed:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  });
};

exports.verifyPlatformPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;

    const order = await DirectOrder.findOne({
      razorOrderIdPlatform: razorpay_order_id,
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update platform fee status
    order.platform_fee_paid = true;
    order.payment_status = "success";
    order.razorPaymentIdPlatform = razorpay_payment_id;

    await order.save();

    return res
      .status(200)
      .json({ message: "Payment verified successfully", order });
  } catch (err) {
    console.error("Payment verification failed:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

exports.rejectOffer = async (req, res) => {
  const { order_id } = req.body;
  const provider_id = req.headers.userID;
  const order = await DirectOrder.findById(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const offer = order.offer_history.find((o) => o.provider_id === provider_id);
  if (!offer || offer.status !== "pending") {
    return res
      .status(400)
      .json({ message: "Invalid rejection or already handled" });
  }

  // Mark rejected
  offer.status = "rejected";
  offer.rejected_at = new Date();

  await order.save();

  res.status(200).json({ message: "Provider rejected. Ready for next offer." });
};

exports.sendToNextProvider = async (req, res) => {
  const { order_id, next_provider_id } = req.body;
  const user_id = req.headers.userID;
  const user = await User.findById(user_id);
  if (user.active === false) {
    return res
      .status(403)
      .json({ message: "User is deactivated. Please Contact to Admin" });
  }
  const order = await DirectOrder.findById(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Add next provider to offer history
  order.offer_history.push({
    provider_id: next_provider_id,
    status: "pending",
  });

  await order.save();

  // Optionally send notification to next provider here

  res.status(200).json({ message: "Offer sent to next provider", order });
};

exports.acceptOffer = async (req, res) => {
  try {
    const { order_id } = req.body;
    const provider_id = req.headers.userID;

    const order = await DirectOrder.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ FIX: Add optional chaining and toString comparison
    const offer = order.offer_history.find(
      (o) => o.provider_id?.toString() === provider_id && o.status === "pending"
    );

    if (!offer) {
      return res
        .status(400)
        .json({ message: "Invalid acceptance or already handled" });
    }

    offer.status = "accepted";
    order.service_provider_id = provider_id;
    order.hire_status = "accepted";

    await order.save();

    return res
      .status(200)
      .json({ message: "Offer accepted by provider", order });
  } catch (error) {
    console.error("Accept offer error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.addPaymentStage = async (req, res) => {
  const { orderId } = req.params;
  const { description, amount, method } = req.body;

  if (!["cod", "online"].includes(method)) {
    return res
      .status(400)
      .json({ message: "Invalid payment method. Use 'cod' or 'online'." });
  }

  const order = await DirectOrder.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Add new payment stage
  order.service_payment.payment_history.push({
    description,
    amount,
    method, // <-- add method here
    status: "pending",
  });

  // Update totals
  order.service_payment.total_expected += amount;
  order.service_payment.remaining_amount += amount;

  await order.save();

  return res.json({
    status: true,
    message: "Payment stage added",
    data: order.service_payment,
  });
};

// exports.makeServicePayment = async (req, res) => {
//   const { orderId } = req.params;
//   const { payment_id, status = "success", description } = req.body;

//   const order = await DirectOrder.findById(orderId);
//   if (!order) return res.status(404).json({ message: "Order not found" });

//   // Find matching unpaid stage
//   const item = order.service_payment.payment_history.find(
//     (p) => p.description === description && p.status === "pending"
//   );
//   if (!item)
//     return res.status(400).json({ message: "Pending payment not found" });

//   // Update that record
//   item.payment_id = payment_id;
//   item.status = status;

//   // Only update if paid successfully
//   if (status === "success") {
//     order.service_payment.amount += item.amount;
//     order.service_payment.remaining_amount =
//       order.service_payment.total_expected - order.service_payment.amount;
//     order.service_payment.type =
//       order.service_payment.amount >= order.service_payment.total_expected
//         ? "full"
//         : "partial";
//   }

//   await order.save();
//   return res.json({
//     status: true,
//     message: "Payment updated",
//     data: order.service_payment,
//   });
// };

exports.makeServicePayment = async (req, res) => {
  const { orderId } = req.params;
  const {
    payment_id,
    status = "success",
    description,
    collected_by,
  } = req.body;

  const order = await DirectOrder.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Find matching pending payment
  const item = order.service_payment.payment_history.find(
    (p) => p.description === description && p.status === "pending"
  );
  if (!item)
    return res.status(400).json({ message: "Pending payment not found" });

  // Set status and payment_id
  item.status = status;
  item.payment_id =
    payment_id || (item.method === "cod" ? "COD-COLLECTED" : "");

  if (status === "success") {
    // Update payment totals
    order.service_payment.amount += item.amount;
    order.service_payment.remaining_amount =
      order.service_payment.total_expected - order.service_payment.amount;

    order.service_payment.type =
      order.service_payment.amount >= order.service_payment.total_expected
        ? "full"
        : "partial";

    // If COD, update COD-related fields within this payment_history item
    if (item.method === "cod") {
      item.is_collected = true;
      item.collected_by = collected_by || "system";
      item.collected_at = new Date();
      item.remarks = `COD payment for "${description}" successfully collected.`;
    }
  }

  await order.save();

  return res.json({
    status: true,
    message: "Payment updated",
    data: order.service_payment,
  });
};

exports.completeOrderServiceProvider = async (req, res) => {
  try {
    const { order_id } = req.body;
    await DirectOrder.findByIdAndUpdate(order_id, { hire_status: "completed" });
    res.json({ message: "Order marked as completed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeOrderUser = async (req, res) => {
  try {
    const { order_id } = req.body;
    await DirectOrder.findByIdAndUpdate(order_id, { user_status: "completed" });
    res.json({ message: "Order marked as completed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrderByUser = async (req, res) => {
  try {
    const { order_id } = req.body;
    await DirectOrder.findByIdAndUpdate(order_id, { hire_status: "cancelled", user_status: "cancelled" }, { new: true });
    res.json({ message: "Order marked as cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllDirectOrders = async (req, res) => {
  try {
    const orders = await DirectOrder.find({ platform_fee_paid: true })
      .populate("user_id", "full_name") // replace 'user_id' with actual field if different
      .populate("service_provider_id", "full_name");

    return res.json({
      status: true,
      message: "Paid direct orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching paid direct orders:", err);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching paid direct orders",
    });
  }
};

// exports.getAllDirectOrdersApi = async (req, res) => {
//   try {
//     const userId = req.headers.userID;
//     const role = req.headers.role;

//     let query = { platform_fee_paid: true };

//     if (role === "user" || role === "both") {
//       // Show orders created by the user
//       query.user_id = userId;
//     } else if (role === "service_provider" || role === "both") {
//       // Show orders where the service provider has made an offer
//       query.service_provider_id = userId;
//     } else {
//       return res.status(403).json({
//         status: false,
//         message: "Unauthorized role",
//       });
//     }

//     const orders = await DirectOrder.find(query)
//       .populate("user_id", "full_name")
//       .populate("service_provider_id", "full_name");

//     return res.json({
//       status: true,
//       message: "Direct orders fetched successfully",
//       data: orders,
//     });
//   } catch (err) {
//     console.error("Error fetching direct orders:", err);
//     return res.status(500).json({
//       status: false,
//       message: "Server error while fetching direct orders",
//     });
//   }
// };

exports.getAllDirectOrdersApi = async (req, res) => {
  try {
    const userId = req.headers.userID;
    const role = req.headers.role;

    let query = { platform_fee_paid: true };

    if (role === "user" || role === "both") {
      query.user_id = userId;
    } else if (role === "service_provider" || role === "both") {
      query = {
        platform_fee_paid: true,
        $or: [
          // Case 1: Service provider already assigned
          { service_provider_id: userId },

          // Case 2: Not assigned yet, check offer history
          {
            service_provider_id: { $exists: false },
            offer_history: {
              $elemMatch: {
                provider_id: userId,
                status: { $in: ["accepted", "rejected", "pending"] },
              },
            },
          },
        ],
      };
    } else {
      return res.status(403).json({
        status: false,
        message: "Unauthorized role",
      });
    }

    const orders = await DirectOrder.find(query)
      .populate("user_id", "full_name phone profile_pic")
      .populate({
        path: "service_provider_id",
        select: "full_name phone profile_pic category_id subcategory_ids",
        populate: [
          {
            path: "category_id",
            model: "WorkCategory",
            select: "name",
          },
          {
            path: "subcategory_ids",
            model: "SubCategory",
            select: "name",
          },
        ],
      })
      .populate({
        path: "offer_history.provider_id",
        select: "full_name phone profile_pic category_id subcategory_ids",
        populate: [
          {
            path: "category_id",
            model: "WorkCategory",
            select: "name",
          },
          {
            path: "subcategory_ids",
            model: "SubCategory",
            select: "name",
          },
        ],
      });
    return res.json({
      status: true,
      message: "Direct orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching direct orders:", err);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching direct orders",
    });
  }
};


exports.getDirectOrderWithWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid order ID",
      });
    }

    // 1. Fetch the direct order with deep population
    const order = await DirectOrder.findById(id)
      .populate("user_id", "full_name phone profile_pic")
      .populate({
        path: "service_provider_id",
        select: "full_name phone profile_pic category_id subcategory_ids",
        populate: [
          {
            path: "category_id",
            model: "WorkCategory", // replace with your actual category model name
            select: "name",
          },
          {
            path: "subcategory_ids",
            model: "SubCategory",
            select: "name",
          },
        ],
      })
      .populate({
        path: "offer_history.provider_id",
        select: "full_name phone profile_pic category_id subcategory_ids",
        populate: [
          {
            path: "category_id",
            model: "WorkCategory",
            select: "name",
          },
          {
            path: "subcategory_ids",
            model: "SubCategory",
            select: "name",
          },
        ],
      });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Direct order not found",
      });
    }

    // 2. Find the worker assigned to this order
    const worker = await Worker.findOne({
      assignOrders: {
        $elemMatch: {
          order_id: new mongoose.Types.ObjectId(id),
          type: "direct",
        },
      },
    });

    return res.json({
      status: true,
      message: "Direct order with assigned worker fetched successfully",
      data: {
        order,
        assignedWorker: worker || null,
      },
    });
  } catch (err) {
    console.error("Error fetching direct order with worker:", err);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching direct order and assigned worker",
    });
  }
};

