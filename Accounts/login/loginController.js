const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const loginModel = require("./loginModel");

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await loginModel.findUserByEmail(email);

    if (!user) {
      console.error("Login attempt: User not found for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if password is hashed (starts with $2a$ or $2b$ for bcrypt)
    const isPasswordHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
    
    let passwordMatch = false;
    if (isPasswordHashed) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // If password is not hashed (legacy data), compare directly
      passwordMatch = user.password === password;
    }

    if (!passwordMatch) {
      console.error("Login attempt: Password mismatch for email:", email);
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


