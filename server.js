const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const nodemailer = require("nodemailer");

const User = require("./models/User");
const Service = require("./models/Service");
const Booking = require("./models/Booking");
const Review = require("./models/Review");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

//////////////////////////////////////////////////
// 📧 EMAILS (Nodemailer config)
//////////////////////////////////////////////////
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "potentialfat@gmail.com",
    pass: "qgyr nhzv cavt hhxn"
  }
});

//////////////////////////////////////////////////
// 🔗 MongoDB
//////////////////////////////////////////////////
mongoose.connect("mongodb+srv://projectuser:project123@cluster0.l5bbwpp.mongodb.net/servicehub?appName=Cluster0")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err.message));

//////////////////////////////////////////////////
// 📝 SIGNUP
//////////////////////////////////////////////////
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).send("Please fill all fields");
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send("User already exists");
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, phone, role });
    res.send("Signup success ✅");
  } catch (err) {
    console.log("Signup Error:", err);
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 🔐 LOGIN (Role-based) - returns user data
//////////////////////////////////////////////////
app.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).send("Enter email & password");
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("User not found");
    if (user.role !== role) return res.status(400).send(`This account is registered as ${user.role}, not ${role}`);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Wrong password");
    res.json({
      message: "Login success",
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 👤 USER PROFILE
//////////////////////////////////////////////////

// Get user profile
app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).send("User not found");
    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Update user profile
app.patch("/user/update", async (req, res) => {
  try {
    const { email, name, phone, address } = req.body;
    if (!name || !phone) return res.status(400).send("Name and phone are required");
    const user = await User.findOneAndUpdate(
      { email },
      { name, phone, address },
      { new: true }
    );
    if (!user) return res.status(404).send("User not found");
    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 🛠️ SERVICE CRUD
//////////////////////////////////////////////////
app.get("/services", async (req, res) => {
  try {
    const { all } = req.query;

    // Auto-deactivate providers with no bookings in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allServices = await Service.find({});
    for (const service of allServices) {
      // Set isActive true for all existing providers that don't have it set
      if (service.isActive === undefined || service.isActive === null) {
        await Service.findByIdAndUpdate(service._id, { isActive: true });
      }
      // Check last booking date for this provider
      const lastBooking = await Booking.findOne(
        { serviceId: service._id.toString(), status: { $ne: "Cancelled" } },
        {},
        { sort: { bookedAt: -1 } }
      );
      if (lastBooking && new Date(lastBooking.bookedAt) < ninetyDaysAgo) {
        // No booking in 90 days - auto deactivate
        await Service.findByIdAndUpdate(service._id, { isActive: false });
      }
    }

    // Now fetch with filter
    const filter = all === 'true' ? {} : { isActive: { $ne: false } };
    const services = await Service.find(filter);

    // Calculate discount applicable flag
    const servicesWithDiscount = await Promise.all(services.map(async (service) => {
      const doc = service.toObject();
      const count = await Booking.countDocuments({ providerName: doc.providerName, status: { $ne: "Cancelled" } });
      doc.discountApplicable = count < 3;
      return doc;
    }));

    res.json(servicesWithDiscount);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/services", async (req, res) => {
  try {
    const { category, serviceName, providerName, price, location, contact, description, services, rating, status, image } = req.body;
    if (!category || !serviceName || !providerName || !price) {
      return res.status(400).send("Please fill required fields");
    }
    const newService = await Service.create({
      category, serviceName, providerName, price,
      location, contact, description, services,
      rating, status, image
    });
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.delete("/services/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).send("Service not found");
    await service.deleteOne();
    res.send("Service removed");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Deactivate a provider (hide from customers)
app.patch("/services/:id/deactivate", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).send("Service not found");
    res.json(service);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Reactivate a provider
app.patch("/services/:id/activate", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!service) return res.status(404).send("Service not found");
    res.json(service);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 📅 BOOKINGS
//////////////////////////////////////////////////

// Customer creates a booking (with double booking prevention)
app.post("/bookings", async (req, res) => {
  try {
    let { providerName, category, serviceName, price, location, rating, customerName, customerEmail, serviceId, bookingDate, timeSlot } = req.body;

    // Enforce compulsory review check for past discounted bookings
    const unreviewedDiscounted = await Booking.findOne({
      customerEmail,
      isDiscounted: true,
      status: "Confirmed"
    });
    if (unreviewedDiscounted) {
      const existingReview = await Review.findOne({
        providerName: unreviewedDiscounted.providerName,
        customerEmail
      });
      if (!existingReview) {
        return res.status(400).send(`You must submit a review for your past discounted service from ${unreviewedDiscounted.providerName} before booking again.`);
      }
    }

    // Prevent double booking - same provider, date and time slot
    if (bookingDate && timeSlot) {
      const existing = await Booking.findOne({
        serviceId,
        bookingDate,
        timeSlot,
        status: { $ne: "Cancelled" }
      });
      if (existing) {
        return res.status(400).send("This time slot is already booked. Please choose another slot.");
      }
    }

    // Apply 50% discount if this is one of the provider's first 3 bookings
    let isDiscounted = false;
    const providerBookingsCount = await Booking.countDocuments({ providerName, status: { $ne: "Cancelled" } });
    if (providerBookingsCount < 3) {
      isDiscounted = true;
      price = String(Math.floor(Number(price) / 2));
    }

    const booking = await Booking.create({
      providerName, category, serviceName, price,
      location, rating, customerName, customerEmail,
      serviceId, bookingDate, timeSlot,
      status: "Pending",
      bookedAt: new Date(),
      isDiscounted
    });

    // 📧 Send confirmation email
    if (customerEmail && customerEmail !== "guest") {
      try {
        await transporter.sendMail({
          from: '"ServiceHub" <potentialfat@gmail.com>',
          to: customerEmail,
          subject: `Booking Confirmed with ${providerName}! 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
              <h2 style="color: #E53E3E; margin-bottom: 5px;">Booking Confirmation</h2>
              <p style="font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
              <p style="font-size: 15px; color: #4A5568;">Your booking request for <strong>${serviceName}</strong> has been successfully sent to <strong>${providerName}</strong>.</p>
              <div style="background-color: #F7FAFC; padding: 18px; border-radius: 10px; margin: 24px 0; border: 1px solid #EDF2F7;">
                <p style="margin: 8px 0;">📅 <strong>Date:</strong> ${new Date(bookingDate).toDateString()}</p>
                <p style="margin: 8px 0;">🕐 <strong>Time:</strong> ${timeSlot}</p>
                <p style="margin: 8px 0;">📍 <strong>Location:</strong> ${location}</p>
                <p style="margin: 8px 0;">💰 <strong>Total Price:</strong> ₹${price}</p>
                <p style="margin: 8px 0; display: inline-block; padding: 4px 10px; background: #FEFCBF; color: #B7791F; border-radius: 999px; font-size: 13px; font-weight: bold;">Status: Pending</p>
              </div>
              <p style="font-size: 14px; color: #718096;">The provider will review your request and you can track its status on your dashboard.</p>
              <hr style="border: none; border-top: 1px solid #EDF2F7; margin: 20px 0;">
              <p style="font-size: 12px; color: #A0AEC0; text-align: center;">Thank you for using ServiceHub! ❤️</p>
            </div>
          `
        });
        console.log("Confirmation email sent to:", customerEmail);
      } catch (mailErr) {
        console.error("Failed to send email:", mailErr.message);
      }
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).send("Server error");
  }
});

// Get booked time slots for a provider on a specific date
app.get("/bookings/slots/:serviceId/:date", async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    const bookings = await Booking.find({
      serviceId,
      bookingDate: date,
      status: { $ne: "Cancelled" }
    });
    const bookedSlots = bookings.map(b => b.timeSlot).filter(Boolean);
    res.json(bookedSlots);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get bookings for a specific customer
app.get("/bookings/customer/:email", async (req, res) => {
  try {
    const bookings = await Booking.find({ customerEmail: req.params.email });
    res.json(bookings);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get bookings for a specific provider
app.get("/bookings/provider/:name", async (req, res) => {
  try {
    const bookings = await Booking.find({ providerName: req.params.name });
    res.json(bookings);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Update booking status (Accept / Reject / Cancel)
app.patch("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// ⭐ REVIEWS
//////////////////////////////////////////////////

// Add a review
app.post("/reviews", async (req, res) => {
  try {
    const { providerId, providerName, customerName, customerEmail, rating, comment } = req.body;
    if (!providerId || !rating || !comment) {
      return res.status(400).send("Please fill all review fields");
    }
    const existing = await Review.findOne({ providerId, customerEmail });
    if (existing) {
      return res.status(400).send("You have already reviewed this provider");
    }
    const review = await Review.create({
      providerId, providerName, customerName, customerEmail, rating, comment
    });
    res.status(201).json(review);
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).send("Server error");
  }
});

// Get all reviews for a provider
app.get("/reviews/:providerId", async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 🔁 FORGOT PASSWORD
//////////////////////////////////////////////////
app.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("User not found");
    const hashed = await bcrypt.hash("123456", 10);
    user.password = hashed;
    await user.save();
    res.send("Password reset to 123456");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});