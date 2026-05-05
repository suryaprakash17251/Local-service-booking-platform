require("dotenv").config();
const twilio = require("twilio");

const smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testSMS() {
  try {
    const message = await smsClient.messages.create({
      body: "Test from Server",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+919391551617" // Assuming this is their real number since they put it in the env file
    });
    console.log("Success! SID:", message.sid);
  } catch (err) {
    console.error("Twilio Error:", err.message);
  }
}

testSMS();
