const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only-change-in-production';

const getUser = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;

    const { userId } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    return null;
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  getUser,
  generateToken
}; 