const mongoose = require("mongoose");

const directOrderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service_provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	 offer_history: [
    {
      provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["pending", "rejected", "accepted"] },
      rejected_at: Date,
    },
  ],
    title: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    deadline: { type: Date, required: true },
    image_url: { type: String },
    platform_fee: Number,
    razorOrderIdPlatform: String,
    platform_fee_paid: { type: Boolean, default: false },
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    hire_status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    assigned_worker: {
      name: String,
      description: String,
      document_url: String,
    },
    razorOrderIdService: String,
    service_payment: {
      amount: { type: Number, default: 0 }, // amount paid so far
      type: { type: String, enum: ["partial", "full"]},
      total_expected: { type: Number }, // total cost expected
      remaining_amount: { type: Number, default: 0 }, // remaining amount
      payment_history: [
        {
          amount: Number,
          date: { type: Date, default: Date.now },
          payment_id: String, // Razorpay or other gateway payment ID
          status: {
            type: String,
            enum: ["success", "failed"],
            default: "success",
          },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DirectOrder", directOrderSchema);
