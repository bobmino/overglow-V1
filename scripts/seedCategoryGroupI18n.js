/**
 * Seed CategoryGroup.nameI18n from lexicon + existing name.
 * Usage: npm run seed-category-i18n
 */
import 'dotenv/config';
import connectDB from '../config/db.js';
import CategoryGroup from '../backend/models/categoryGroupModel.js';
import { translateText } from '../backend/utils/catalogLexicon.js';

const run = async () => {
  await connectDB();
  const groups = await CategoryGroup.find({});
  let updated = 0;

  for (const group of groups) {
    const name = group.name || '';
    group.nameI18n = {
      fr: name,
      en: translateText(name, 'en'),
      es: translateText(name, 'es'),
      ar: translateText(name, 'ar'),
    };
    await group.save();
    updated += 1;
  }

  console.log(`CategoryGroup i18n seed done. updated=${updated}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
