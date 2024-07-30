const jwt = require('jsonwebtoken');
const { getUserById } = require('../model/user');

const adminAuthenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ errorMessage: 'Access denied. No token provided or invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded, 'deoded here')
    req.user = decoded;

    const user = await getUserById(req.user.id);
    console.log(user, 'user here')
    if (!user) {
      return res.status(403).json({ errorMessage: 'Access denied. User not found.' });
    }

    if (user && user.role !== 'admin') {
        return res.status(403).json({ errorMessage: 'Access denied. Admins Only can access this resource.' });
      }
  

    next();
  } catch (error) {
    console.log(error, 'error here')
    res.status(400).json({ errorMessage: 'Invalid token.' });
  }
};

module.exports = adminAuthenticateToken;