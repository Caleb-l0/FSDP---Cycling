const crypto = require('crypto');
const nodemailer = require('nodemailer');

async function loginUser(req, res) {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await loginModel.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await loginModel.setOTP(email, otp, expiry);

    // Send email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`
    });

    res.json({ message: "OTP sent to your email" });
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

async function sendOTP(req, res) {
  try {
    const { email } = req.body;
    const user = await loginModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await loginModel.setOTP(email, otp, expiry);

    // Send email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp, rememberMe } = req.body;
    const isValid = await loginModel.verifyOTP(email, otp);
    if (!isValid) return res.status(401).json({ error: "Invalid or expired OTP" });

    const user = await loginModel.findUserByEmail(email);
    const textSizePreference = user.textSizePreference || 'normal';

    const expiresIn = rememberMe ? "7d" : "2h";

    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name,   
        email: user.email, 
        role: user.role,
        textSizePreference
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      textSizePreference,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
}

module.exports = { loginUser, getUserById, updateUser, deleteUser, sendOTP, verifyOTP };


