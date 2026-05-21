import jwt from 'jsonwebtoken';

// Generate access token (medium-lived: 24 hours for better UX)
export const generateAccessToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // CORRECTION: Augmenter la durée de vie du token à 24h pour éviter les erreurs 401 fréquentes
  // Le refresh token de 7 jours reste en place comme fallback
  return jwt.sign({ id, role, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: '24h', // Extended access token lifetime
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
