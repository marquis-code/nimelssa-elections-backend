const jwt = require('jsonwebtoken');
const { getUserById } = require('../model/user');

const userAuthenticateToken = async (req, res, next) => {
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

    if (user && user.role !== 'user') {
        return res.status(403).json({ errorMessage: 'Access denied. LoggedIn users Only can access this resource.' });
      }
  

    next();
  } catch (error) {
    res.status(400).json({ errorMessage: 'Invalid token.' });
  }
};

module.exports = userAuthenticateToken;
