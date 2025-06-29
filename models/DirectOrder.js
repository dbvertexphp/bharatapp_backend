const mongoose = require("mongoose");

const directOrderSchema = new mongoose.Schema(
  {
    project_id: String,
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
    razorPaymentIdPlatform: String,
    platform_fee_paid: { type: Boolean, default: false },
    payment_status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    hire_status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled", "cancelledDispute"],
      default: "pending",
    },
    user_status: {
      type: String,
      enum: ["completed", "cancelled", "cancelledDispute"],
      default: null,
    },
    assigned_worker: {
      name: String,
      description: String,
      document_url: String,
    },
   service_payment: {
  amount: { type: Number, default: 0 },
  type: { type: String, enum: ["partial", "full"] },
  total_expected: { type: Number, default: 0 },
  remaining_amount: { type: Number, default: 0 },
  payment_history: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      payment_id: String,
      description: String,
      method: {
        type: String,
        enum: ["cod", "online"],
        required: true,
      },
      status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "pending",
      },
      // COD-specific fields
      is_collected: { type: Boolean, default: false },
      collected_by: { type: String },
      collected_at: { type: Date },
      remarks: { type: String },
    },
  ],
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("DirectOrder", directOrderSchema);
