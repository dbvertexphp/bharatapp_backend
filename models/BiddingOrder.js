const mongoose = require('mongoose');

const BiddingOrderSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // UI Fields from the Form
  title: {
    type: String,
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCategory',
    required: true,
  },
  sub_category_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    }
  ],
  address: {
    type: String,
    required: true,
  },
  google_address: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
  image_url: {
    type: String, // store uploaded file path or URL
  },

  // Bidding and Payment Fields
  selected_offer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BiddingOffer',
    default: null,
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
  platform_fee: {
    type: Number,
    default: 0,
  },
  razorOrderIdPlatform: String,
  razorPaymentIdPlatform: String,
  platform_fee_paid: {
    type: Boolean,
    default: false,
  },
  service_payment: {
    amount: {
      type: Number,
      default: 0,
    },
    total_expected: {
      type: Number,
      default: 0,
    },
    remaining_amount: {
      type: Number,
      default: 0,
    },
    payment_history: {
      type: Array,
      default: [],
    }
  }

}, { timestamps: true });

module.exports = mongoose.model('BiddingOrder', BiddingOrderSchema);
