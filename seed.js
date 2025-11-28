import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend/models/userModel.js';
import Operator from './backend/models/operatorModel.js';
import Product from './backend/models/productModel.js';
import Schedule from './backend/models/scheduleModel.js';
import connectDB from './config/db.js';

dotenv.config();

const sampleProducts = [
  {
    title: "Vatican Museums, Sistine Chapel & St Peter's Basilica Tour",
    description: "Skip the line and explore the Vatican's masterpieces with an expert guide.",
    category: "Tours",
    city: "Rome",
    address: "Vatican City, Rome",
    location: { type: "Point", coordinates: [12.4534, 41.9029] },
    images: ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800"],
    status: "Published"
  },
  {
    title: "SUMMIT One Vanderbilt Experience",
    description: "Ascend to new heights at NYC's newest observation deck.",
    category: "Tickets",
    city: "New York City",
    address: "One Vanderbilt, New York, NY",
    location: { type: "Point", coordinates: [-73.9780, 40.7527] },
    images: ["https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800"],
    status: "Published"
  },
  {
    title: "Sagrada Familia Guided Tour with Skip the Line",
    description: "Discover Gaudí's unfinished masterpiece with priority access.",
    category: "Tours",
    city: "Barcelona",
    address: "Sagrada Familia, Barcelona",
    location: { type: "Point", coordinates: [2.1744, 41.4036] },
    images: ["https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800"],
    status: "Published"
  },
  {
    title: "Tuscany Day Trip from Florence: Siena, San Gimignano & Chianti",
    description: "Explore medieval towns and taste world-famous wines.",
    category: "Day Trips",
    city: "Florence",
    address: "Florence, Tuscany",
    location: { type: "Point", coordinates: [11.2558, 43.7696] },
    images: ["https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800"],
    status: "Published"
  },
  {
    title: "Eiffel Tower Summit Access with Host",
    description: "Skip the crowds and head straight to the top of Paris' icon.",
    category: "Tickets",
    city: "Paris",
    address: "Eiffel Tower, Paris",
    location: { type: "Point", coordinates: [2.2945, 48.8584] },
    images: ["https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800"],
    status: "Published"
  },
  {
    title: "Tower of London and Crown Jewels Exhibition",
    description: "Explore 1000 years of history and see the Crown Jewels.",
    category: "Tickets",
    city: "London",
    address: "Tower of London, London",
    location: { type: "Point", coordinates: [-0.0759, 51.5081] },
    images: ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800"],
    status: "Published"
  },
  {
    title: "Cancun Snorkeling Tour at MUSA Underwater Museum",
    description: "Discover underwater sculptures and vibrant marine life.",
    category: "Activities",
    city: "Cancun",
    address: "Cancun, Quintana Roo",
    location: { type: "Point", coordinates: [-86.8475, 21.1619] },
    images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"],
    status: "Published"
  },
  {
    title: "Colosseum Underground and Arena Floor Tour",
    description: "Walk where gladiators once fought in ancient Rome.",
    category: "Tours",
    city: "Rome",
    address: "Colosseum, Rome",
    location: { type: "Point", coordinates: [12.4924, 41.8902] },
    images: ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800"],
    status: "Published"
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Product.deleteMany();
    await Schedule.deleteMany();
    await Operator.deleteMany();
    await User.deleteMany();

    console.log('Data cleared');

    // Create a sample operator user
    const operatorUser = await User.create({
      name: 'Sample Operator',
      email: 'operator@overglow.com',
      password: 'password123',
      role: 'Opérateur'
    });

    // Create operator profile
    const operator = await Operator.create({
      user: operatorUser._id,
      companyName: 'Overglow Tours',
      description: 'Premium travel experiences worldwide',
      status: 'Verified'
    });

    console.log('Operator created');

    // Create products
    const products = await Product.insertMany(
      sampleProducts.map(p => ({ ...p, operator: operator._id }))
    );

    console.log(`${products.length} products created`);

    // Create schedules for each product
    for (const product of products) {
      const schedules = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        
        schedules.push({
          product: product._id,
          date: date,
          time: '10:00',
          capacity: 20,
          price: Math.floor(Math.random() * 100) + 50,
          currency: 'EUR'
        });
      }
      await Schedule.insertMany(schedules);
    }

    console.log('Schedules created');
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
