import mongoose from "mongoose";
import { createIndexes } from "../backend/utils/dbIndexes.js";

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      // Create indexes if not already done
      await createIndexes();
      return;
    }

    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set in environment variables');
      // Don't exit on Vercel, allow server to start without DB
      if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
        process.exit(1);
      }
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes after connection
    await createIndexes();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't exit on Vercel, allow serverless function to start
    // The connection will be retried on first request
    if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
      process.exit(1);
    }
  }
};

export default connectDB;
