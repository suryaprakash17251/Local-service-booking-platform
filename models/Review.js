const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  providerId: String,
  providerName: String,
  customerName: String,
  customerEmail: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", ReviewSchema);