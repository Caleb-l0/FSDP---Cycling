const bcrypt = require("bcryptjs");
const signupModel = require("./signupModel");


async function signupUser(req, res) {
  try {
    console.log("Signup request body:", req.body);  // <-- log request
    const { name, email, password } = req.body;
    
    const existingUser = await signupModel.findUserByEmail(email);
    console.log("Existing user:", existingUser);

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    await signupModel.createUser(name, email, hashedPassword);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error full:", err);  // <-- log full error
    res.status(500).json({ error: "Signup failed" });
  }
}


module.exports = { signupUser };
