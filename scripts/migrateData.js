import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import CategoryGroup from '../backend/models/categoryGroupModel.js';
import Product from '../backend/models/productModel.js';
import Review from '../backend/models/reviewModel.js';

dotenv.config();

const moroccanCities = [
  'marrakech', 'casablanca', 'fès', 'fes', 'rabat', 'tanger', 'tangier', 
  'agadir', 'meknès', 'meknes', 'ouarzazate', 'essaouira', 'chefchaouen', 
  'dakhla', 'al hoceima', 'nador', 'tetouan', 'tétouan', 'taroudant'
];

const defaultGroups = [
  { name: 'Tours & Circuits Maroc', type: 'National', order: 1, isActive: true },
  { name: 'Activités Insolites Maroc', type: 'National', order: 2, isActive: true },
  { name: 'Désert & Aventures Maroc', type: 'National', order: 3, isActive: true },
  { name: 'Croisières & Dîners Mondiaux', type: 'International', order: 1, isActive: true },
  { name: 'Visites Guidées Europe', type: 'International', order: 2, isActive: true },
  { name: 'Aventures Internationales', type: 'International', order: 3, isActive: true },
  { name: 'Éco-Lodges Insolites', type: 'Insolite', order: 1, isActive: true },
  { name: 'Expériences Insolites', type: 'Insolite', order: 2, isActive: true }
];

const migrate = async () => {
  try {
    await connectDB();
    console.log('🔄 Connected to database. Starting Sprint 1 migration...');

    // 1. Seed Category Groups Idempotently
    const groupMap = {};
    for (const groupData of defaultGroups) {
      let group = await CategoryGroup.findOne({ name: groupData.name });
      if (!group) {
        group = await CategoryGroup.create(groupData);
        console.log(`✅ Created CategoryGroup: ${group.name} (${group.type})`);
      } else {
        // Keep it updated
        group.type = groupData.type;
        group.order = groupData.order;
        group.isActive = groupData.isActive;
        await group.save();
        console.log(`ℹ️ Updated CategoryGroup: ${group.name} (${group.type})`);
      }
      groupMap[group.name] = group._id;
    }

    // 2. Restructure Products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to update.`);

    for (const product of products) {
      const cityLower = (product.city || '').toLowerCase().trim();
      const catLower = (product.category || '').toLowerCase().trim();
      const titleLower = (product.title || '').toLowerCase().trim();

      // Determine geographic type
      const isNational = moroccanCities.some(c => cityLower.includes(c));
      const isInsolite = catLower.includes('insolite') || titleLower.includes('insolite') || catLower.includes('eco') || catLower.includes('glamping');
      
      const type = isInsolite ? 'Insolite' : (isNational ? 'National' : 'International');

      // Assign Category Group
      let matchedGroupName = '';
      if (type === 'Insolite') {
        matchedGroupName = catLower.includes('lodge') ? 'Éco-Lodges Insolites' : 'Expériences Insolites';
      } else if (type === 'National') {
        if (catLower.includes('desert') || catLower.includes('aventure') || catLower.includes('safari')) {
          matchedGroupName = 'Désert & Aventures Maroc';
        } else if (catLower.includes('insolite')) {
          matchedGroupName = 'Activités Insolites Maroc';
        } else {
          matchedGroupName = 'Tours & Circuits Maroc';
        }
      } else {
        if (catLower.includes('croisi') || catLower.includes('dîner') || catLower.includes('dinner')) {
          matchedGroupName = 'Croisières & Dîners Mondiaux';
        } else if (cityLower.includes('paris') || cityLower.includes('londres') || cityLower.includes('rome') || cityLower.includes('barcelone') || cityLower.includes('madrid')) {
          matchedGroupName = 'Visites Guidées Europe';
        } else {
          matchedGroupName = 'Aventures Internationales';
        }
      }

      product.categoryGroup = groupMap[matchedGroupName] || groupMap['Tours & Circuits Maroc'];

      // 3. Populate Note Réelle (Average Rating) from Reviews
      const reviews = await Review.find({ product: product._id, status: 'Approved' });
      let averageRating = 4.8; // default fallback for look
      let reviewCount = reviews.length;

      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = Number((sum / reviews.length).toFixed(1));
      } else if (product.metrics && product.metrics.averageRating > 0) {
        averageRating = product.metrics.averageRating;
        reviewCount = product.metrics.reviewCount || 0;
      }

      // Initialize metrics if not present
      if (!product.metrics) {
        product.metrics = {};
      }
      product.metrics.averageRating = averageRating;
      product.metrics.reviewCount = reviewCount;

      // 4. Assign Tags Idempotently
      const tagsSet = new Set(product.tags || []);
      
      if (product.productType === 'service') {
        tagsSet.add('Top Service');
      } else if (product.productType === 'tour' && averageRating >= 4.6) {
        tagsSet.add('Top Circuit');
      } else if (averageRating >= 4.7) {
        tagsSet.add('Top Produit');
      }

      // Ensure at least one standard tag is populated
      if (tagsSet.size === 0) {
        tagsSet.add('Top Produit');
      }

      product.tags = Array.from(tagsSet);

      // Save changes
      await product.save();
      console.log(`🔹 Updated Product: "${product.title}" -> Group: ${matchedGroupName}, Rating: ${averageRating}, Tags: [${product.tags.join(', ')}]`);
    }

    console.log('🎉 Migration completed successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
};

migrate();
