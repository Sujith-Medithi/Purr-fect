import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes.
 * Reads JWT from httpOnly cookie, verifies it, and attaches user ID to req.user.
 */
const protect = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — invalid token' });
  }
};

export default protect;
