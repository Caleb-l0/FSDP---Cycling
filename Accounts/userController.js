const userModel = require('../Accounts/models/userModel');
const bcrypt = require('bcryptjs');

module.exports = {
  signup: async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    try {
      const exists = await userModel.checkUserExists(email);
      if (exists) return res.status(400).json({ message: 'Email already exists' });

      await userModel.createUser(name, email, password);
      res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    try {
      const user = await userModel.getUserByEmail(email);
      if (!user) return res.status(400).json({ message: 'Invalid email or password' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: 'Invalid email or password' });

      res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
