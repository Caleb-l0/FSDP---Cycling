const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  console.log('Token extracted:', token ? 'Present' : 'Missing');
  console.log('Token length:', token ? token.length : 0);
  
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    console.log('JWT verification successful, user:', user);
    req.user = user;
    next();
  });
}

module.exports = { authenticate };
