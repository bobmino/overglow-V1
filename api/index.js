// Vercel serverless function entry point
import app from '../server.js';

// Export as a handler function for Vercel
// This ensures CORS is properly handled in serverless context
export default async (req, res) => {
  // Ensure CORS headers are set before handling the request
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://overglow-v1-3jqp.vercel.app',
    'https://overglow-v1.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
  ];
  
  let allowedOrigin = '*';
  if (origin && (allowedOrigins.includes(origin) || origin.includes('.vercel.app'))) {
    allowedOrigin = origin;
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Pass to Express app
  return app(req, res);
};
