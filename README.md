# ServiceHub

A simple and intuitive service booking application built with Node.js, Express, MongoDB, and Vanilla HTML/CSS/JS.

## Features

*   **Role-Based Authentication:** Users can sign up and log in as either a `Customer` or a `Provider`.
*   **Service Management:** Providers can list their services. Admin can manage services (activate/deactivate). Providers are auto-deactivated if they have no bookings for 90 days.
*   **Smart Booking System:**
    *   Prevents double bookings for the same provider, date, and time slot.
    *   Applies an automatic 50% discount for the first 3 bookings of a provider.
*   **Notifications:**
    *   **Email Confirmations:** Customers receive email confirmations via Nodemailer (Gmail integration) upon successful booking.
    *   **SMS Notifications:** Customers receive SMS notifications via Twilio.
*   **Reviews & Ratings:** Customers can leave reviews and ratings for providers after a booking. Compulsory review check for discounted bookings before booking again.
*   **Dashboards:** Dedicated dashboards for Customers, Providers, and Admins to manage profiles, bookings, and services.

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose)
*   **Frontend:** Vanilla HTML, CSS, JavaScript
*   **Authentication:** bcryptjs for password hashing
*   **Notifications:** Nodemailer (Email), Twilio (SMS)
*   **Other:** CORS, dotenv

## Prerequisites

*   Node.js installed
*   MongoDB instance (Local or MongoDB Atlas)
*   Twilio Account (Optional, for SMS notifications)
*   Gmail App Password (Optional, for email notifications)

## Setup and Installation

1.  **Clone the repository or navigate to the project directory:**
    ```bash
    cd redesign
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    *   Copy the `.env.example` file to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Fill in the required variables in your `.env` file:
        ```env
        MONGO_URI=your_mongodb_connection_string
        GMAIL_USER=your_gmail_address
        GMAIL_PASS=your_gmail_app_password
        TWILIO_ACCOUNT_SID=your_twilio_sid
        TWILIO_AUTH_TOKEN=your_twilio_auth_token
        TWILIO_PHONE_NUMBER=your_twilio_phone_number
        ```

4.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:5000`.

## Project Structure

*   `server.js`: The main entry point for the Express application, containing all API routes and backend logic.
*   `models/`: Contains Mongoose models for User, Service, Booking, and Review.
*   `public/`: Contains all static frontend assets (HTML, CSS, JS).
*   `Dockerfile` / `.dockerignore`: Configuration files for containerizing the application.

## API Endpoints Overview

*   **Auth:** `/signup`, `/login`, `/forgot`
*   **Users:** `/user/:email`, `/user/update`
*   **Services:** `/services` (GET, POST), `/services/:id` (DELETE), `/services/:id/deactivate`, `/services/:id/activate`
*   **Bookings:** `/bookings` (POST), `/bookings/slots/:serviceId/:date`, `/bookings/customer/:email`, `/bookings/provider/:name`, `/bookings/:id` (PATCH)
*   **Reviews:** `/reviews` (POST, GET)

## License

ISC License
