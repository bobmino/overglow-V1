/**
 * Smoke booking différé (vérifie TX Mongo rs0).
 * Usage (Docker API) :
 *   docker compose exec api node -r dotenv/config scripts/smokeBookingTx.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import connectDB from '../config/db.js';
import Product from '../backend/models/productModel.js';
import Schedule from '../backend/models/scheduleModel.js';
import User from '../backend/models/userModel.js';

dotenv.config();

const API = process.env.SMOKE_API_URL || 'http://127.0.0.1:5001';

const run = async () => {
  await connectDB();

  const product = await Product.findOne({
    status: 'Published',
    slug: 'medina-marrakech-guide-prive',
  }).lean();
  if (!product) throw new Error('Product not found');

  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() + 1); // demain+ pour éviter créneau du jour déjà passé

  const schedule = await Schedule.findOne({
    product: product._id,
    date: { $gte: from },
    capacity: { $gte: 1 },
  })
    .sort({ date: 1 })
    .lean();
  if (!schedule) throw new Error('No future schedule');

  const admin = await User.findOne({ email: 'admin@overglow.online' }).lean();
  if (!admin) throw new Error('Admin not found');

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const body = {
    scheduleId: String(schedule._id),
    numberOfTickets: 1,
    deferPayment: true,
  };

  const res = await fetch(`${API}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  const booking = data.booking || data;
  console.log(
    JSON.stringify(
      {
        http: res.status,
        ok: res.ok,
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        deferred: data.deferred,
        message: data.message,
        txMode: process.env.DISABLE_MONGO_TX === 'true' ? 'disabled' : 'rs0-enabled',
      },
      null,
      2
    )
  );

  if (!res.ok) process.exit(1);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
