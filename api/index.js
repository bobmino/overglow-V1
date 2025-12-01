// Vercel serverless function entry point
import app from '../server.js';

// Export as a handler function for Vercel
export default async (req, res) => {
  return app(req, res);
};

