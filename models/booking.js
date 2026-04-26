const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  providerName: String,
  category: String,
  serviceName: String,
  price: String,
  location: String,
  rating: Number,
  customerName: String,
  customerEmail: String,
  serviceId: String,
  bookingDate: String,
  timeSlot: String,
  status: { type: String, default: "Pending" },
  bookedAt: { type: Date, default: Date.now },
  isDiscounted: { type: Boolean, default: false }
});

module.exports = mongoose.model("Booking", BookingSchema);