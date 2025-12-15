import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import Review from '../models/reviewModel.js';
import Notification from '../models/notificationModel.js';

/**
 * Create database indexes for optimal query performance
 */
export const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');

    // Product indexes
    await Product.collection.createIndex({ status: 1, city: 1, category: 1 });
    await Product.collection.createIndex({ status: 1, 'skipTheLine.enabled': 1 });
    await Product.collection.createIndex({ operator: 1, status: 1 });
    await Product.collection.createIndex({ title: 'text', description: 'text' }); // Text search
    await Product.collection.createIndex({ createdAt: -1 });
    await Product.collection.createIndex({ 'metrics.viewCount': -1 });
    await Product.collection.createIndex({ 'metrics.bookingCount': -1 });
    await Product.collection.createIndex({ price: 1 });

    // Booking indexes
    await Booking.collection.createIndex({ user: 1, createdAt: -1 });
    await Booking.collection.createIndex({ operator: 1, status: 1 });
    await Booking.collection.createIndex({ schedule: 1 });
    await Booking.collection.createIndex({ status: 1, createdAt: -1 });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isApproved: 1 });

    // Operator indexes
    await Operator.collection.createIndex({ user: 1 }, { unique: true });
    await Operator.collection.createIndex({ status: 1 });
    await Operator.collection.createIndex({ companyName: 'text' });

    // Review indexes
    await Review.collection.createIndex({ product: 1, status: 1 });
    await Review.collection.createIndex({ user: 1, createdAt: -1 });
    await Review.collection.createIndex({ status: 1, createdAt: -1 });

    // Notification indexes
    await Notification.collection.createIndex({ user: 1, isRead: 1, createdAt: -1 });
    await Notification.collection.createIndex({ user: 1, isRead: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't throw - indexes might already exist
  }
};

