import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import Product from '../backend/models/productModel.js';
import User from '../backend/models/userModel.js';
import Operator from '../backend/models/operatorModel.js';

// Pre-defined luxury images
const IMAGES = [
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518557984649-7b161c230cfa?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558223631-4a945b64c489?q=80&w=1000&auto=format&fit=crop'
];

const main = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log(`Connected to: ${mongoose.connection.name}`);

    console.log('Dropping collections...');
    try {
      await mongoose.connection.db.collection('products').drop();
    } catch (e) {
      if (e.code !== 26) console.error(e);
    }
    
    try {
      await mongoose.connection.db.collection('users').drop();
    } catch (e) {
      if (e.code !== 26) console.error(e);
    }
    
    try {
      await mongoose.connection.db.collection('bookings').drop();
    } catch (e) {
      if (e.code !== 26) console.error(e);
    }
    
    try {
      await mongoose.connection.db.collection('operators').drop();
    } catch (e) {
      if (e.code !== 26) console.error(e);
    }

    console.log('Collections dropped.');

    // Create a dummy admin & operator to link products
    const user = await User.create({
      name: 'Overglow Admin',
      email: 'admin@overglow.local',
      password: 'password123', // In a real script this would be hashed
      role: 'Admin',
      isApproved: true,
      approvedAt: new Date()
    });

    const operator = await Operator.create({
      user: user._id,
      companyName: 'Overglow Premium Partner',
      description: 'Partenaire certifié',
      status: 'Active',
      isFormCompleted: true,
      isClaimed: true
    });

    const products = [];
    const activities = [
      'Surf Premium', 'Spa & Hammam', 'Quad dans les Dunes', 
      'Randonnée Équestre', 'Dîner sous les Étoiles', 'Coucher de Soleil en Bateau',
      'Atelier Cuisine Marocaine', 'Visite de la Médina', 'Balade en Chameau',
      'Vol en Montgolfière', 'Excursion Vallée du Paradis', 'Kitesurf Initiation',
      'Jet Ski', 'Yoga au Lever du Soleil', 'Sandboard au Crépuscule',
      'Atelier Poterie Locale', 'Dégustation de Thés', 'Bivouac de Luxe',
      'Photographie Guidée', 'Massage aux Huiles Essentielles'
    ];

    for (let i = 0; i < 20; i++) {
      products.push({
        operator: operator._id,
        title: `${activities[i]} à Agadir`,
        description: `Profitez d'une expérience inoubliable avec notre offre ${activities[i]}. Qualité garantie et service premium au cœur d'Agadir.`,
        category: i % 2 === 0 ? 'Aventure' : 'Bien-être',
        city: 'Agadir',
        address: 'Marina Agadir, 80000',
        duration: '3 heures',
        price: 50 + (i * 10),
        images: [IMAGES[i % IMAGES.length]],
        status: 'Published',
        slug: `agadir-${activities[i].toLowerCase().replace(/\s+/g, '-')}-${i}`,
        location: {
          type: 'Point',
          coordinates: [-9.598107, 30.427755]
        }
      });
    }

    console.log('Inserting products...');
    await Product.insertMany(products);
    console.log('✅ 20 Agadir products successfully seeded!');

    process.exit(0);
  } catch (error) {
    console.error('Error during reset and seed:', error);
    process.exit(1);
  }
};

main();
