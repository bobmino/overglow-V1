import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './backend/models/userModel.js';
import Operator from './backend/models/operatorModel.js';
import Product from './backend/models/productModel.js';
import Schedule from './backend/models/scheduleModel.js';

const sampleProducts = [
  // Paris - Tours
  {
    title: 'Eiffel Tower Skip-the-Line Guided Tour',
    description: 'Skip the long lines and enjoy a guided tour of the iconic Eiffel Tower with breathtaking views of Paris.',
    category: 'Tours',
    city: 'Paris',
    address: 'Champ de Mars, 5 Avenue Anatole France',
    location: { type: 'Point', coordinates: [2.2945, 48.8584] },
    images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'],
    status: 'Published',
    basePrice: 45
  },
  {
    title: 'Louvre Museum Private Tour',
    description: 'Explore the world\'s largest art museum with a private guide and see masterpieces like the Mona Lisa.',
    category: 'Attractions',
    city: 'Paris',
    address: 'Rue de Rivoli',
    location: { type: 'Point', coordinates: [2.3376, 48.8606] },
    images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
    status: 'Published',
    basePrice: 120
  },
  {
    title: 'Seine River Dinner Cruise',
    description: 'Enjoy a romantic dinner cruise along the Seine with stunning views of illuminated Paris landmarks.',
    category: 'Food & Drink',
    city: 'Paris',
    address: 'Port de la Bourdonnais',
    location: { type: 'Point', coordinates: [2.2945, 48.8606] },
    images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
    status: 'Published',
    basePrice: 95
  },

  // Rome - Activities
  {
    title: 'Colosseum and Roman Forum Walking Tour',
    description: 'Step back in time with a guided walking tour of ancient Rome\'s most iconic landmarks.',
    category: 'Tours',
    city: 'Rome',
    address: 'Piazza del Colosseo',
    location: { type: 'Point', coordinates: [12.4922, 41.8902] },
    images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'],
    status: 'Published',
    basePrice: 55
  },
  {
    title: 'Vatican Museums and Sistine Chapel Tour',
    description: 'Discover the artistic treasures of the Vatican with skip-the-line access and expert guidance.',
    category: 'Attractions',
    city: 'Rome',
    address: 'Viale Vaticano',
    location: { type: 'Point', coordinates: [12.4534, 41.9029] },
    images: ['https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800'],
    status: 'Published',
    basePrice: 75
  },
  {
    title: 'Rome Food Tour: Trastevere District',
    description: 'Taste authentic Roman cuisine in the charming Trastevere neighborhood with a local foodie guide.',
    category: 'Food & Drink',
    city: 'Rome',
    address: 'Trastevere',
    location: { type: 'Point', coordinates: [12.4698, 41.8896] },
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
    status: 'Published',
    basePrice: 85
  },

  // Barcelona - Day Trips
  {
    title: 'Sagrada Familia Fast-Track Entry & Guided Tour',
    description: 'Marvel at Gaudí\'s masterpiece with priority access and insights from an expert guide.',
    category: 'Attractions',
    city: 'Barcelona',
    address: 'Carrer de Mallorca, 401',
    location: { type: 'Point', coordinates: [2.1744, 41.4036] },
    images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'],
    status: 'Published',
    basePrice: 40
  },
  {
    title: 'Montserrat Mountain Day Trip',
    description: 'Escape to the stunning Montserrat mountain range and visit the famous monastery.',
    category: 'Day Trips',
    city: 'Barcelona',
    address: 'Montserrat',
    location: { type: 'Point', coordinates: [1.8375, 41.5931] },
    images: ['https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800'],
    status: 'Published',
    basePrice: 65
  },
  {
    title: 'Barcelona Tapas Walking Tour',
    description: 'Discover Barcelona\'s culinary scene with tastings at the best tapas bars in the Gothic Quarter.',
    category: 'Food & Drink',
    city: 'Barcelona',
    address: 'Gothic Quarter',
    location: { type: 'Point', coordinates: [2.1769, 41.3825] },
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    status: 'Published',
    basePrice: 70
  },

  // London - Cultural Tours
  {
    title: 'Tower of London and Crown Jewels Tour',
    description: 'Explore the historic Tower of London and see the magnificent Crown Jewels up close.',
    category: 'Attractions',
    city: 'London',
    address: 'Tower Hill',
    location: { type: 'Point', coordinates: [-0.0759, 51.5081] },
    images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800'],
    status: 'Published',
    basePrice: 50
  },
  {
    title: 'Harry Potter Walking Tour',
    description: 'Follow in the footsteps of Harry Potter and discover filming locations across London.',
    category: 'Tours',
    city: 'London',
    address: 'King\'s Cross Station',
    location: { type: 'Point', coordinates: [-0.1239, 51.5308] },
    images: ['https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'],
    status: 'Published',
    basePrice: 35
  },
  {
    title: 'London Eye Fast-Track Ticket',
    description: 'Skip the queues and enjoy panoramic views of London from the iconic London Eye.',
    category: 'Attractions',
    city: 'London',
    address: 'Riverside Building, County Hall',
    location: { type: 'Point', coordinates: [-0.1195, 51.5033] },
    images: ['https://images.unsplash.com/photo-1543832923-44667a44c804?w=800'],
    status: 'Published',
    basePrice: 38
  },

  // Dubai - Outdoor Activities
  {
    title: 'Desert Safari with BBQ Dinner',
    description: 'Experience the thrill of dune bashing, camel riding, and a traditional BBQ dinner under the stars.',
    category: 'Outdoor Activities',
    city: 'Dubai',
    address: 'Dubai Desert Conservation Reserve',
    location: { type: 'Point', coordinates: [55.3781, 25.0657] },
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'],
    status: 'Published',
    basePrice: 90
  },
  {
    title: 'Burj Khalifa At The Top Sky Ticket',
    description: 'Ascend to the world\'s tallest building and enjoy breathtaking views from the 148th floor.',
    category: 'Attractions',
    city: 'Dubai',
    address: '1 Sheikh Mohammed bin Rashid Blvd',
    location: { type: 'Point', coordinates: [55.2744, 25.1972] },
    images: ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800'],
    status: 'Published',
    basePrice: 150
  },
  {
    title: 'Dubai Marina Yacht Cruise',
    description: 'Sail along Dubai Marina on a luxury yacht with stunning skyline views.',
    category: 'Activities',
    city: 'Dubai',
    address: 'Dubai Marina',
    location: { type: 'Point', coordinates: [55.1406, 25.0806] },
    images: ['https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800'],
    status: 'Published',
    basePrice: 110
  },

  // New York - Shows & Performances
  {
    title: 'Broadway Show Tickets',
    description: 'Experience the magic of Broadway with premium tickets to top-rated shows.',
    category: 'Shows & Performances',
    city: 'New York',
    address: 'Broadway, Times Square',
    location: { type: 'Point', coordinates: [-73.9855, 40.7580] },
    images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800'],
    status: 'Published',
    basePrice: 125
  },
  {
    title: 'Statue of Liberty and Ellis Island Tour',
    description: 'Visit two of America\'s most iconic landmarks with ferry access and guided tours.',
    category: 'Attractions',
    city: 'New York',
    address: 'Liberty Island',
    location: { type: 'Point', coordinates: [-74.0445, 40.6892] },
    images: ['https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800'],
    status: 'Published',
    basePrice: 60
  },
  {
    title: 'Central Park Bike Tour',
    description: 'Explore Central Park\'s hidden gems on a guided bike tour through NYC\'s green oasis.',
    category: 'Outdoor Activities',
    city: 'New York',
    address: 'Central Park',
    location: { type: 'Point', coordinates: [-73.9654, 40.7829] },
    images: ['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800'],
    status: 'Published',
    basePrice: 45
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing products and schedules...');
    await Product.deleteMany({});
    await Schedule.deleteMany({});

    console.log('👤 Finding or creating operator...');
    let operator = await Operator.findOne().populate('user');
    
    if (!operator) {
      // Create a sample operator user
      const operatorUser = await User.create({
        name: 'Sample Operator',
        email: 'operator@overglow.com',
        password: 'password123',
        role: 'Opérateur'
      });

      operator = await Operator.create({
        user: operatorUser._id,
        companyName: 'Overglow Tours & Activities',
        description: 'Premium travel experiences worldwide'
      });
    }

    console.log(`✅ Using operator: ${operator.companyName}`);

    console.log('🌍 Creating sample products...');
    const createdProducts = [];

    for (const productData of sampleProducts) {
      const product = await Product.create({
        ...productData,
        operator: operator._id,
        user: operator.user
      });

      // Create schedules for the next 30 days
      const schedules = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Create 2 time slots per day (morning and afternoon)
        const timeSlots = ['09:00', '14:00'];
        
        for (const time of timeSlots) {
          const baseVariation = productData.basePrice + (Math.random() * 20 - 10);
          const roundedBase = Math.floor(baseVariation);
          // Randomly choose .49 or .99 ending
          const ending = Math.random() > 0.5 ? 0.99 : 0.49;
          const finalPrice = roundedBase + ending;
          
          schedules.push({
            product: product._id,
            date: date,
            time: time,
            capacity: Math.floor(Math.random() * 20) + 10, // 10-30 capacity
            availableSlots: Math.floor(Math.random() * 20) + 10, // 10-30 slots
            price: finalPrice
          });
        }
      }

      await Schedule.insertMany(schedules);
      createdProducts.push(product);
    }

    console.log(`✅ Created ${createdProducts.length} products with schedules`);
    console.log('\n📊 Products by category:');
    
    const categories = {};
    createdProducts.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
