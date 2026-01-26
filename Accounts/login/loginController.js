const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const loginModel = require("./loginModel");

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt for email:", email);
    
    if (!email || !password) {
      console.error("Login attempt: Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim();
    const user = await loginModel.findUserByEmail(normalizedEmail);

    if (!user) {
      console.error("Login attempt: User not found for email:", normalizedEmail);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found - ID:", user.id, "Role:", user.role, "Password exists:", !!user.password);

    // Check if password field exists and is not null
    if (!user.password) {
      console.error("Login attempt: User has no password set for email:", normalizedEmail);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if password is hashed (starts with $2a$ or $2b$ for bcrypt)
    const isPasswordHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
    
    let passwordMatch = false;
    try {
      if (isPasswordHashed) {
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password comparison (hashed):", passwordMatch);
      } else {
        // If password is not hashed (legacy data), compare directly
        passwordMatch = user.password === password;
        console.log("Password comparison (plain):", passwordMatch);
      }
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!passwordMatch) {
      console.error("Login attempt: Password mismatch for email:", normalizedEmail);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Handle both lowercase (PostgreSQL) and camelCase (legacy) field names
    const textSizePreference = user.textsizepreference || user.textSizePreference || 'normal';

    const token = jwt.sign(
  { 
    id: user.id, 
    name: user.name,   
    email: user.email, 
    role: user.role,
    textSizePreference
  },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);
//store all these in the token//

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      textSizePreference,
     
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

async function getUserById(req, res) {
  const userId = req.params.id;

  try {
    const user = await loginModel.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user failed:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateUser(req, res) {
  const userId = req.params.id;
  const { name, email, textSizePreference } = req.body;

  try {
    await loginModel.updateUser(userId, name, email, textSizePreference);
    res.json({ message: "User updated" });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
}

async function deleteUser(req, res) {
  const userId = req.params.id;

  try {
    await loginModel.deleteUser(userId);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Delete failed" });
  }
}

module.exports = { loginUser, getUserById, updateUser, deleteUser };


