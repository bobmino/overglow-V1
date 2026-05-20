import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './backend/models/userModel.js';
import Operator from './backend/models/operatorModel.js';
import Product from './backend/models/productModel.js';
import Schedule from './backend/models/scheduleModel.js';
import Booking from './backend/models/bookingModel.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to DB');

    // 1. Check if there are any products and if they have operators
    const products = await Product.find({}).limit(5).populate('operator');
    console.log(`Found ${products.length} products:`);
    for (const p of products) {
      console.log(`- Product: ${p.title} (${p._id})`);
      console.log(`  Operator ref in product: ${p.operator}`);
      if (p.operator) {
        console.log(`  Operator CompanyName: ${p.operator.companyName}`);
      } else {
        console.log('  ⚠️ WARNING: Product has no operator populated or operator ref is empty!');
      }
    }

    // 2. Fetch a sample user to act as the booking user
    const user = await User.findOne({ email: 'operator@overglow.com' });
    console.log('Sample user:', user ? `${user.name} (${user._id})` : 'Not found');

    if (products.length > 0 && user) {
      const targetProduct = products[0];
      
      // Let's check if the product has a valid operator in the database
      const operatorExists = await Operator.findById(targetProduct.operator);
      console.log('Operator document in database exists:', !!operatorExists);
      if (operatorExists) {
        console.log('Operator user ref:', operatorExists.user);
      }
      
      console.log('\n--- SIMULATING VIRTUAL SCHEDULE CREATION AND BOOKING ---');
      const virtualScheduleData = {
        productId: targetProduct._id,
        date: new Date(),
        time: '12:00',
        endTime: '14:00',
        capacity: 100,
        price: targetProduct.price || 50,
        currency: 'EUR'
      };

      console.log('Creating schedule...');
      let schedule;
      try {
        schedule = await Schedule.create({
          product: virtualScheduleData.productId,
          date: virtualScheduleData.date,
          time: virtualScheduleData.time,
          endTime: virtualScheduleData.endTime,
          capacity: virtualScheduleData.capacity,
          price: virtualScheduleData.price,
          currency: virtualScheduleData.currency
        });
        console.log('Schedule created successfully:', schedule._id);
      } catch (err) {
        console.error('❌ Schedule creation failed:', err);
      }

      if (schedule) {
        console.log('Creating booking...');
        const serviceDate = schedule.date ? new Date(schedule.date) : new Date();
        const payoutDate = new Date(serviceDate);
        payoutDate.setDate(payoutDate.getDate() + 7);
        const payoutEligibleDate = new Date(serviceDate);
        payoutEligibleDate.setDate(payoutEligibleDate.getDate() + 7);

        try {
          const booking = new Booking({
            user: user._id,
            schedule: schedule._id,
            operator: targetProduct.operator, // wait, what if targetProduct.operator is not an ObjectId but populated object?
            numberOfTickets: 2,
            totalAmount: (targetProduct.price || 50) * 2,
            totalPrice: (targetProduct.price || 50) * 2,
            status: 'Pending',
            paymentIntentId: 'fake_payment_intent',
            paymentStatus: 'pending',
            paymentMethod: 'stripe',
            deliveryAddress: '',
            payoutStatus: 'pending',
            payoutDate,
            payoutEligibleDate,
          });

          await booking.save();
          console.log('✅ Booking saved successfully:', booking._id);

          // Clean up the created schedule and booking
          await Booking.deleteOne({ _id: booking._id });
          await Schedule.deleteOne({ _id: schedule._id });
          console.log('Cleaned up test data');
        } catch (err) {
          console.error('❌ Booking save failed:', err);
          if (err.name === 'ValidationError') {
            console.error('Validation errors:', Object.keys(err.errors).map(key => `${key}: ${err.errors[key].message}`));
          }
          await Schedule.deleteOne({ _id: schedule._id });
        }
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error in run:', err);
  }
};

run();
