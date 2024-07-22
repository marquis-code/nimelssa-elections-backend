const jwt = require('jsonwebtoken');
const User = require('../model/user'); // Adjust the path to your User model

const authenticateToken = async (req, res, next) => {
  const token = req.cookies['ELECTION_AUTH_TOKEN'];

  if (!token) {
    return res.status(401).json({ errorMessage: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ errorMessage: 'Access denied. Admins only.' });
    }

    next();
  } catch (error) {
    res.status(400).json({ errorMessage: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
