
const Razorpay = require("razorpay");
const crypto = require("crypto");
const DirectOrder = require("../models/DirectOrder.js");
const PlatformFee = require("../models/PlatformFee.js");
const razorpay = require("../config/razorpay.js");
const upload = require("../middleware/uploadMiddleware.js");

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
		 console.log("uuuu", user_id );
    const {title, description, address, deadline, first_provider_id } = req.body;
    const platformAmount = await PlatformFee.findOne({ type: "direct" });
    if (!platformAmount) {
      return res.status(400).json({ message: "Platform fee not configured" });
    }

    const image_url = req.file ? "/uploads/directOrder/" + req.file.filename : null;

    const amountInPaise = platformAmount.fee * 100;
		console.log("amountInPaise", amountInPaise)

    // Create Razorpay Order
    const razorOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `platform_fee_${Date.now()}`,
      payment_capture: 1,
    });

    // Save DirectOrder
    const order = await DirectOrder.create({
      user_id,
      title,
      description,
      address,
      deadline,
      image_url,
			 offer_history: [{
      provider_id: first_provider_id,
      status: "pending"
    }],
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
    return res.status(500).json({ message: "Server error", error: error.message });
  }
})
}


exports.verifyPlatformPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // const generated_signature = crypto
    //   .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    //   .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    //   .digest("hex");

    // if (generated_signature !== razorpay_signature) {
    //   return res.status(400).json({ message: "Invalid payment signature" });
    // }

    // Find the order in DB
    const order = await DirectOrder.findOne({ razorOrderIdPlatform: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update platform fee status
    order.platform_fee_paid = true;
    order.payment_status = "success";
    order.razorpay_payment_id = razorpay_payment_id;

    await order.save();

    return res.status(200).json({ message: "Payment verified successfully", order });

  } catch (err) {
    console.error("Payment verification failed:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.rejectOffer = async (req, res) => {
  const { order_id } = req.body;
  const provider_id = req.headers.userID;
  const order = await DirectOrder.findById(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const offer = order.offer_history.find(o => o.provider_id === provider_id);
  if (!offer || offer.status !== "pending") {
    return res.status(400).json({ message: "Invalid rejection or already handled" });
  }

  // Mark rejected
  offer.status = "rejected";
  offer.rejected_at = new Date();

  await order.save();

  res.status(200).json({ message: "Provider rejected. Ready for next offer." });
};


exports.sendToNextProvider = async (req, res) => {
  const { order_id, next_provider_id } = req.body;

  const order = await DirectOrder.findById(order_id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Add next provider to offer history
  order.offer_history.push({
    provider_id: next_provider_id,
    status: "pending"
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
      o => o.provider_id?.toString() === provider_id && o.status === "pending"
    );

    if (!offer) {
      return res.status(400).json({ message: "Invalid acceptance or already handled" });
    }

    offer.status = "accepted";
    order.service_provider_id = provider_id;
    order.hire_status = "accepted";

    await order.save();

    return res.status(200).json({ message: "Offer accepted by provider", order });
  } catch (error) {
    console.error("Accept offer error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addPaymentStage = async (req, res) => {
  const { orderId } = req.params;
  const { description, amount } = req.body;

  const order = await DirectOrder.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Add new stage
  order.service_payment.payment_history.push({
    description,
    amount,
    status: "pending"
  });

  // Update totals
  order.service_payment.total_expected += amount;
  order.service_payment.remaining_amount += amount;

  await order.save();
  return res.json({ status: true, message: "Payment stage added", data: order.service_payment });
};


exports.makeServicePayment = async (req, res) => {
  const { orderId } = req.params;
  const { payment_id, status = "success", description } = req.body;

  const order = await DirectOrder.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Find matching unpaid stage
  const item = order.service_payment.payment_history.find(
    (p) => p.description === description && p.status === "pending"
  );
  if (!item) return res.status(400).json({ message: "Pending payment not found" });

  // Update that record
  item.payment_id = payment_id;
  item.status = status;

  // Only update if paid successfully
  if (status === "success") {
    order.service_payment.amount += item.amount;
    order.service_payment.remaining_amount = order.service_payment.total_expected - order.service_payment.amount;
    order.service_payment.type = order.service_payment.amount >= order.service_payment.total_expected ? "full" : "partial";
  }

  await order.save();
  return res.json({ status: true, message: "Payment updated", data: order.service_payment });
};




// exports.makeServicePayment = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { amount, payment_id, status = "success", description = "" } = req.body;

//     if (!amount || !payment_id) {
//       return res.status(400).json({ status: false, message: "Amount and payment_id are required." });
//     }

//     const order = await DirectOrder.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ status: false, message: "Order not found" });
//     }

//     const previousAmount = order.service_payment.amount || 0;
//     const totalExpected = order.service_payment.total_expected || 0;
//     const newAmount = previousAmount + amount;

//     order.service_payment.amount = newAmount;
//     order.service_payment.remaining_amount = Math.max(0, totalExpected - newAmount);
//     order.service_payment.type = newAmount >= totalExpected ? "full" : "partial";

//     order.service_payment.payment_history.push({
//       amount,
//       payment_id,
//       status,
//       description, // ✅ description saved here
//     });

//     await order.save();

//     return res.status(200).json({
//       status: true,
//       message: "Payment updated successfully",
//       data: order.service_payment,
//     });
//   } catch (err) {
//     console.error("Payment error:", err);
//     return res.status(500).json({ status: false, message: "Server error", error: err.message });
//   }
// };

exports.getAllDirectOrders = async (req, res) => {
  try {
    const orders = await DirectOrder.find({ platform_fee_paid: true })
      .populate('user_id', 'name') // replace 'user_id' with actual field if different
      .populate('service_provider_id', 'name');

    return res.json({
      status: true,
      message: "Paid direct orders fetched successfully",
      data: orders
    });
  } catch (err) {
    console.error("Error fetching paid direct orders:", err);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching paid direct orders"
    });
  }
};




exports.assignWorker = async (req, res) => {
  try {
    const { order_id, name, description, document_url } = req.body;

    await DirectOrder.findByIdAndUpdate(order_id, {
      assigned_worker: { name, description, document_url }
    });

    res.json({ message: "Worker assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const { order_id } = req.body;
    await DirectOrder.findByIdAndUpdate(order_id, { hire_status: "completed" });
    res.json({ message: "Order marked as completed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addServicePayment = async (req, res) => {
  try {
    const { orderId, amount, payment_id, status = "success" } = req.body;

    // Fetch the order
    const order = await DirectOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Initialize if needed
    if (!order.service_payment) {
      return res.status(400).json({ message: "Service payment not initialized in this order." });
    }

    // Update payment history
    order.service_payment.payment_history = order.service_payment.payment_history || [];
    order.service_payment.payment_history.push({
      amount,
      payment_id,
      status,
    });

    // Update total paid
    order.service_payment.amount = (order.service_payment.amount || 0) + amount;

    // Update remaining
    const totalExpected = order.service_payment.total_expected || 0;
    order.service_payment.remaining_amount = Math.max(
      totalExpected - order.service_payment.amount,
      0
    );

    // Update type
    if (order.service_payment.remaining_amount === 0) {
      order.service_payment.type = "full";
    } else {
      order.service_payment.type = "partial";
    }

    await order.save();

    return res.status(200).json({
      message: "Payment recorded successfully",
      service_payment: order.service_payment,
    });

  } catch (err) {
    console.error("Add Service Payment Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
