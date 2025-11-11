const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const loginModel = require("./loginModel");

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const user = await loginModel.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET
);
//store all these in the token//

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
     
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
  const { name, email } = req.body;

  try {
    await loginModel.updateUser(userId, name, email);
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


