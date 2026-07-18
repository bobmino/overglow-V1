import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const testLogin = async () => {
  try {
    console.log('🔍 Testing login connection...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
    console.log('');

    // Connect to database
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Check admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@overglow.online';
    console.log(`👤 Looking for admin user: ${adminEmail}`);
    
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('\n💡 To create an admin user, run:');
      console.log('   npm run create-admin');
      process.exit(1);
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Is Approved: ${admin.isApproved}`);
    console.log(`   Has Password: ${admin.password ? '✅ Yes' : '❌ No'}`);
    console.log(`   Failed Login Attempts: ${admin.failedLoginAttempts || 0}`);
    
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      console.log(`   ⚠️  Account locked until: ${admin.lockedUntil}`);
    } else {
      console.log(`   ✅ Account not locked`);
    }

    // Test password (if provided)
    const testPassword = process.argv[2];
    if (testPassword) {
      console.log('\n🔐 Testing password...');
      try {
        const passwordMatch = await admin.matchPassword(testPassword);
        if (passwordMatch) {
          console.log('✅ Password is correct!');
        } else {
          console.log('❌ Password is incorrect!');
        }
      } catch (error) {
        console.log('❌ Error testing password:', error.message);
      }
    } else {
      console.log('\n💡 To test password, run:');
      console.log(`   node -r dotenv/config scripts/testLogin.js "your_password"`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testLogin();

