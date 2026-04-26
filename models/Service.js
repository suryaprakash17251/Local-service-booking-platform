const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  category: String,
  serviceName: String,
  providerName: String,
  price: String,
  location: String,
  contact: String,
  description: String,
  services: String,
  rating: Number,
  status: { type: String, default: "Available" },
  image: String,
  isActive: { type: Boolean, default: true }  // ✅ US#11: active/inactive toggle
});

module.exports = mongoose.model("Service", ServiceSchema);