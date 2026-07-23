/**
 * Smoke E2E API — onboarding wizard opérateur jusqu'à submit.
 * Usage Docker:
 *   WIZARD_EMAIL=... WIZARD_PASSWORD=... docker compose exec -T api node -r dotenv/config scripts/smokeOperatorWizard.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../backend/models/userModel.js';
import Operator from '../backend/models/operatorModel.js';

dotenv.config();

const API = process.env.SMOKE_API_BASE || 'http://127.0.0.1:5001';
const EMAIL = process.env.WIZARD_EMAIL || 'elkhalilelkhalil1a@gmail.com';
const PASSWORD = process.env.WIZARD_PASSWORD || '';

const desc =
  'Agence locale spécialisée dans les expériences authentiques au Maroc : médinas, désert, surf et accueils personnalisés pour voyageurs francophones.';

async function put(token, path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function post(token, path, body = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: EMAIL });
  if (!user) throw new Error(`User not found: ${EMAIL}`);

  // Mot de passe temporaire pour le smoke (si WIZARD_PASSWORD fourni, on l'utilise tel quel)
  const smokePassword = PASSWORD || `SmokeWizard${Date.now().toString().slice(-6)}!`;
  user.password = smokePassword;
  user.isApproved = true;
  await user.save();

  // Reset wizard state for clean smoke
  let operator = await Operator.findOne({ user: user._id });
  if (!operator) {
    operator = await Operator.create({
      user: user._id,
      status: 'Pending',
      isFormCompleted: false,
      completedSteps: [],
      location: { country: 'Maroc' },
    });
  } else {
    operator.status = 'Pending';
    operator.isFormCompleted = false;
    operator.completedSteps = [];
    operator.providerType = undefined;
    await operator.save();
  }

  // Override login password for this run
  process.env.WIZARD_PASSWORD = smokePassword;
  const token = await (async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: smokePassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`login ${res.status}: ${JSON.stringify(data)}`);
    return data.token;
  })();

  await put(token, '/api/operator/wizard/provider-type', { providerType: 'company' });
  await put(token, '/api/operator/wizard/public-info', {
    publicName: 'Khalil Experiences',
    description: desc,
    location: { city: 'Agadir', address: 'Centre ville', postalCode: '80000', country: 'Maroc' },
  });
  await put(token, '/api/operator/wizard/photos', { logo: '', gallery: [] });
  await put(token, '/api/operator/wizard/address', {
    companyAddress: {
      street: 'Avenue Hassan II',
      city: 'Agadir',
      postalCode: '80000',
      country: 'Maroc',
    },
  });
  await put(token, '/api/operator/wizard/experiences', {
    experiences:
      'Guides locaux, transferts aéroport, riads partenaires et activités surf Taghazout.',
  });
  await put(token, '/api/operator/wizard/private-info', {
    companyInfo: {
      companyName: 'Khalil Experiences SARL',
      registrationNumber: 'RC123456',
      kbis: 'ICE000',
      siret: '00000000000000',
      legalForm: 'SARL',
      capital: 10000,
      headquarters: 'Agadir',
    },
  });
  const submitted = await post(token, '/api/operator/wizard/submit');

  const op = await Operator.findOne({ user: user._id }).lean();
  console.log(
    JSON.stringify(
      {
        ok: true,
        email: EMAIL,
        status: op.status,
        isFormCompleted: op.isFormCompleted,
        completedSteps: op.completedSteps,
        progressPercent: Math.min(
          100,
          Math.round(((op.completedSteps || []).length / 6) * 100)
        ),
        submitMessage: submitted.message,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
