const jwt = require("jsonwebtoken");
const loginModel = require("../Accounts/login/loginModel");
const signupModel = require("../Accounts/signup/signupModel");
const pool = require("../Postgres_config");

/**
 * OTP Login Controller
 * - If user exists: login and return JWT token
 * - If user doesn't exist: create account with email (default role: volunteer) and return JWT token
 */
async function otpLogin(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await loginModel.findUserByEmail(normalizedEmail);

    if (!user) {
      // User doesn't exist - create account
      // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
      const emailName = normalizedEmail.split("@")[0];
      const name = emailName
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "User";

      // Create user with OTP (no password required for OTP login)
      // Password can be null for OTP users
      const query = `
        INSERT INTO users (name, email, password, role, textsizepreference)
        VALUES ($1, $2, NULL, $3, $4)
        RETURNING id, name, email, role, textsizepreference
      `;

      const values = [name, normalizedEmail, "volunteer", "normal"];

      const result = await pool.query(query, values);
      user = result.rows[0];

      console.log("✅ New user created via OTP:", normalizedEmail);
    } else {
      console.log("✅ Existing user logged in via OTP:", normalizedEmail);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      textSizePreference: user.textsizepreference || "normal",
      isNewUser: !user.password, // Indicate if this was a new account
    });
  } catch (err) {
    console.error("❌ OTP login error:", err);
    res.status(500).json({
      message: "OTP login failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

module.exports = { otpLogin };
