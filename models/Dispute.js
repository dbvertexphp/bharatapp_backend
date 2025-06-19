const mongoose = require("mongoose");


const disputeSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  flow_type: {
    type: String,
    enum: ['direct', 'emergency', 'bidding'],
    required: true,
  },
  raised_by: { // who created dispute
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  against: { // who dispute is raised against
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: Number,
  description: String,
  requirement: String,
  image: String,
  status: {
    type: String,
    enum: ['pending', 'resolved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model("Dispute", disputeSchema);
