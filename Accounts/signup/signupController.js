const bcrypt = require("bcryptjs");
const signupModel = require("./signupModel");


async function signupUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await signupModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await signupModel.createUser(
      name,
      email,
      hashedPassword,
      role || "user"
    );

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    console.error("Signup error full:", err);
    res.status(500).json({ message: "Signup failed" });
  }
}


module.exports = { signupUser };
