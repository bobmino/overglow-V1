import jwt from 'jsonwebtoken';

// Generate access token (short-lived: 1 hour)
export const generateAccessToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id, role, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Short-lived access token
  });
};

// Generate refresh token (long-lived: 7 days)
export const generateRefreshToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id, role, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Long-lived refresh token
  });
};

// Legacy function for backward compatibility
const generateToken = (id, role) => {
  return generateAccessToken(id, role);
};

export default generateToken;
