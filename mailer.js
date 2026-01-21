const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn(
    "[mailer] Missing EMAIL_USER / EMAIL_PASSWORD env vars. Email sending will fail until configured."
  );
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  defaults: {
    from: EMAIL_USER
  },
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  },
  connectionTimeout: 6000,
  greetingTimeout: 6000,
  socketTimeout: 8000
});

// Verify on startup so we can see auth / network issues in logs early
transporter.verify((err) => {
  if (err) {
    console.error("[mailer] Transport verify failed:", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response
    });
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.error("[mailer] EMAIL_USER / EMAIL_PASSWORD not set. Configure environment variables on the server.");
    }
  } else {
    console.log("[mailer] Transport ready");
  }
});

module.exports = transporter;