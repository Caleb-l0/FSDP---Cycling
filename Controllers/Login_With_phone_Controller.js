const jwt = require("jsonwebtoken");
const { getUserByPhone, createUserWithPhone } = require("../Models/Login_with_phone_Model");

async function phoneAuth(req, res) {
  const { phone, firebaseUid } = req.body;

  if (!phone || !firebaseUid) {
    return res.status(400).json({ message: "Missing phone or firebaseUid" });
  }

  try {
    let user = await getUserByPhone(phone);

    if (!user) {
      // REGISTER
      user = await createUserWithPhone(phone, firebaseUid);
    }

    // LOGIN
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      userId: user.id,
      name: user.name,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Phone login failed" });
  }
}

module.exports = {
  phoneAuth
};
