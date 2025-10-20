const jwt = require('jsonwebtoken');
const { getUserById } = require('../model/user');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ errorMessage: 'Access denied. No token provided or invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(403).json({ errorMessage: 'Access denied. User not found.' });
    }

    // ✅ Allow all authenticated users (admin or not)
    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ errorMessage: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
