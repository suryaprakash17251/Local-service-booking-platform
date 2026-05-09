# 🛠️ ServiceHub — Local Service Booking Platform

A full-stack web application that connects customers with local service providers. Users can browse services, book appointments, and receive notifications via email and SMS.

---


## 🚀 Features

- **Role-based access** — Separate flows for Customers and Service Providers
- **Service browsing & booking** — Customers can discover and book local services
- **Email notifications** — Booking confirmations sent via Nodemailer (Gmail)
- **SMS notifications** — Real-time alerts powered by Twilio
- **Secure authentication** — Passwords hashed with bcryptjs
- **MongoDB database** — Persistent data storage with Mongoose
- **Docker support** — Containerized for easy deployment

---

## 🧰 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Runtime    | Node.js                           |
| Framework  | Express.js v5                     |
| Database   | MongoDB + Mongoose                |
| Email      | Nodemailer (Gmail)                |
| SMS        | Twilio                            |
| Auth       | bcryptjs                          |
| Frontend   | HTML, CSS, JavaScript             |
| DevOps     | Docker                            |

---

## 📁 Project Structure

```
Local-service-booking-platform/
├── models/              # Mongoose data models
├── public/              # Frontend HTML, CSS, JS files
├── server.js            # Main Express server & API routes
├── test-twilio.js       # Twilio SMS integration test
├── .env.example         # Environment variable template
├── Dockerfile           # Docker configuration
├── package.json         # Project dependencies
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- A [Twilio](https://www.twilio.com/) account (for SMS)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) enabled

### 1. Clone the Repository

```bash
git clone https://github.com/suryaprakash17251/Local-service-booking-platform.git
cd Local-service-booking-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGO_URI=your_mongodb_uri_here
GMAIL_USER=your_gmail_address_here
GMAIL_PASS=your_gmail_app_password_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### 4. Run the Application

```bash
npm start
```

The server will start on `http://localhost:3000` (or the configured port).

---

## 🐳 Running with Docker

```bash
# Build the image
docker build -t servicehub .

# Run the container
docker run -p 3000:3000 --env-file .env servicehub
```

---

## 🧪 Testing Twilio Integration

To verify your Twilio SMS setup independently:

```bash
node test-twilio.js
```

---

## 📋 API Overview

The server exposes REST API endpoints for:

- **Auth** — User registration and login
- **Services** — List and manage available services
- **Bookings** — Create and view bookings
- **Notifications** — Trigger email/SMS confirmations

*(Refer to `server.js` for the full route definitions.)*

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**suryaprakash17251** — [GitHub Profile](https://github.com/suryaprakash17251)
