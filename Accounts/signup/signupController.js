const bcrypt = require("bcryptjs");
const signupModel = require("./signupModel");

async function signupUser(req, res) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await signupModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await signupModel.createUser(name, email, hashedPassword);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

module.exports = { signupUser };
