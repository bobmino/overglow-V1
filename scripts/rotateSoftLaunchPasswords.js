/**
 * Rotation mdp soft-launch (admin + partenaire).
 * Usage Docker:
 *   RESET_ADMIN_PASSWORD='...' RESET_PARTNER_PASSWORD='...' \
 *   docker compose exec -T api node -r dotenv/config scripts/rotateSoftLaunchPasswords.js
 *
 * Ne log jamais les mots de passe en clair.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../backend/models/userModel.js';

dotenv.config();

const ADMIN_EMAIL = process.env.RESET_ADMIN_EMAIL || 'admin@overglow.online';
const PARTNER_EMAIL =
  process.env.RESET_PARTNER_EMAIL || 'partenaire@overglow.online';
const ADMIN_PASSWORD = process.env.RESET_ADMIN_PASSWORD || '';
const PARTNER_PASSWORD = process.env.RESET_PARTNER_PASSWORD || '';

const rotate = async (email, password, label) => {
  if (!password || password.length < 10) {
    throw new Error(`${label}: password missing or too short (min 10)`);
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`${label}: user not found (${email})`);
  }
  user.password = password; // pre-save hook hashes
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();
  return { email, role: user.role, ok: true };
};

const run = async () => {
  await connectDB();
  const results = [];
  results.push(await rotate(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin'));
  results.push(await rotate(PARTNER_EMAIL, PARTNER_PASSWORD, 'partner'));
  console.log(JSON.stringify({ rotated: results }, null, 2));
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
