import 'dotenv/config';
import connectDB from './config/db.js';
import { getHomepageLayout } from './backend/controllers/homepageController.js';
import mongoose from 'mongoose';

const test = async () => {
  try {
    await connectDB();
    
    const mockReq = {};
    const mockRes = {
      status: function(code) {
        console.log('Status code:', code);
        return this;
      },
      json: function(data) {
        console.log('--- API RESPONSE ---');
        console.log('Success:', data.success);
        console.log('Error Message:', data.message);
        console.log('Error details:', data.error);
        console.log('Performance responseTimeMs:', data.performance?.responseTimeMs);
        console.log('Keys in layout:', Object.keys(data.layout || {}));
        console.log('Top Destinations count:', data.layout?.topDestinations?.length);
        console.log('National Categories count:', data.layout?.offers?.national?.length);
        console.log('International Categories count:', data.layout?.offers?.international?.length);
        console.log('Insolite Categories count:', data.layout?.offers?.insolite?.length);
        console.log('Top Circuits count:', data.layout?.topCircuits?.length);
        console.log('Top Services count:', data.layout?.topServices?.length);
        console.log('Top Products count:', data.layout?.topProducts?.length);
        console.log('--------------------');
        
        if (data.success && data.performance?.responseTimeMs < 200) {
          console.log('✅ API test passed successfully! (TTFB < 200ms)');
        } else if (data.success) {
          console.log('⚠️ API test passed but TTFB exceeded 200ms:', data.performance?.responseTimeMs);
        } else {
          console.error('❌ API test failed!');
        }
      }
    };

    await getHomepageLayout(mockReq, mockRes);
    mongoose.disconnect();
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

test();
