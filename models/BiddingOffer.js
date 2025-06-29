const BiddingOfferSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BiddingOrder',
    required: true,
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bid_amount: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // days
    required: true,
  },
  message: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('BiddingOffer', BiddingOfferSchema);
