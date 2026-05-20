import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const productSchema = new mongoose.Schema({ operator: mongoose.Schema.Types.ObjectId }, { strict: false });
const Product = mongoose.model('Product', productSchema, 'products');

const operatorSchema = new mongoose.Schema({ companyName: String }, { strict: false });
const Operator = mongoose.model('Operator', operatorSchema, 'operators');

async function fix() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    let operator = await Operator.findOne();
    if (!operator) {
      console.log('No operator found! Creating one...');
      operator = await Operator.create({ companyName: 'Default Operator' });
    }
    console.log(`Using Operator: ${operator._id}`);

    const result = await Product.updateMany(
      { operator: { $exists: false } },
      { $set: { operator: operator._id } }
    );
    console.log(`Updated ${result.modifiedCount} products with missing operator!`);

    const result2 = await Product.updateMany(
      { operator: null },
      { $set: { operator: operator._id } }
    );
    console.log(`Updated ${result2.modifiedCount} products with null operator!`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
