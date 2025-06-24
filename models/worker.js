const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  aadharNumber: String,
  dob: Date,
  address: String,
  image: String,
  service_provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  verifyStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  assignOrders: [
    {
      order_id: mongoose.Schema.Types.ObjectId,
      type: {
        type: String,
        enum: ["direct", "bidding", "emergency"]
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Worker", WorkerSchema);
