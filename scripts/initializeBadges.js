import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/userModel.js';
import Product from '../backend/models/productModel.js';
import Operator from '../backend/models/operatorModel.js';
import connectDB from '../config/db.js';
import { initializeDefaultBadges, updateProductMetrics, updateOperatorMetrics } from '../backend/utils/badgeService.js';

dotenv.config();

const initializeBadges = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    // Wait a bit for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connected');

    // Step 1: Initialize default badges
    console.log('\n📛 Step 1: Initializing default badges...');
    await initializeDefaultBadges();
    console.log('✅ Default badges initialized');

    // Step 2: Get all products and operators
    console.log('\n📦 Step 2: Fetching products and operators...');
    const products = await Product.find({});
    const operators = await Operator.find({});
    console.log(`✅ Found ${products.length} products and ${operators.length} operators`);

    // Step 3: Mark products with default authenticity flags
    console.log('\n🏷️  Step 3: Marking products with authenticity flags...');
    let productsUpdated = 0;
    for (const product of products) {
      const needsUpdate = !product.authenticity || 
        product.authenticity.isArtisan === undefined ||
        product.authenticity.isAuthenticLocal === undefined;
      
      if (needsUpdate) {
        product.authenticity = {
          isArtisan: false,
          isAuthenticLocal: true, // Default: assume local products are authentic
          isEcoFriendly: false,
          isTraditional: true, // Default: assume traditional
          isLocal100: true, // Default: assume 100% local
        };
        await product.save();
        productsUpdated++;
      }
    }
    console.log(`✅ Updated ${productsUpdated} products with authenticity flags`);

    // Step 4: Mark operators with default authenticity flags
    console.log('\n👥 Step 4: Marking operators with authenticity flags...');
    let operatorsUpdated = 0;
    for (const operator of operators) {
      const needsUpdate = !operator.authenticity || 
        operator.authenticity.isArtisan === undefined ||
        operator.authenticity.isAuthenticLocal === undefined;
      
      if (needsUpdate) {
        operator.authenticity = {
          isArtisan: false,
          isAuthenticLocal: true, // Default: assume local operators are authentic
          isEcoFriendly: false,
          isLocal100: true, // Default: assume 100% local
          isTraditional: true, // Default: assume traditional
        };
        await operator.save();
        operatorsUpdated++;
      }
    }
    console.log(`✅ Updated ${operatorsUpdated} operators with authenticity flags`);

    // Step 5: Calculate and assign badges for all products
    console.log('\n🏆 Step 5: Calculating badges for products...');
    let productsWithBadges = 0;
    for (const product of products) {
      try {
        await updateProductMetrics(product._id);
        productsWithBadges++;
        if (productsWithBadges % 10 === 0) {
          console.log(`  Processed ${productsWithBadges}/${products.length} products...`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating badges for product ${product._id}:`, error.message);
      }
    }
    console.log(`✅ Calculated badges for ${productsWithBadges} products`);

    // Step 6: Calculate and assign badges for all operators
    console.log('\n🏆 Step 6: Calculating badges for operators...');
    let operatorsWithBadges = 0;
    for (const operator of operators) {
      try {
        await updateOperatorMetrics(operator._id);
        operatorsWithBadges++;
        if (operatorsWithBadges % 10 === 0) {
          console.log(`  Processed ${operatorsWithBadges}/${operators.length} operators...`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating badges for operator ${operator._id}:`, error.message);
      }
    }
    console.log(`✅ Calculated badges for ${operatorsWithBadges} operators`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  - Products updated: ${productsUpdated}`);
    console.log(`  - Operators updated: ${operatorsUpdated}`);
    console.log(`  - Products with badges calculated: ${productsWithBadges}`);
    console.log(`  - Operators with badges calculated: ${operatorsWithBadges}`);
    console.log('\n✅ Badge initialization completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing badges:', error);
    process.exit(1);
  }
};

initializeBadges();

