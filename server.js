// server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './backend/routes/authRoutes.js';
import operatorRoutes from './backend/routes/operatorRoutes.js';
import homepageRoutes from './backend/routes/homepageRoutes.js'; // 1. Importer les routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB (inchangée)
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI manquante");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connecté avec succès");
  } catch (err) {
    console.error("Erreur connexion MongoDB:", err.message);
  }
};
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/homepage', homepageRoutes); // 2. Monter les routes ici (et supprimer l'ancien app.get('/api/homepage/layout'))

// Gestionnaire d'erreur global
app.use((err, req, res, next) => {
  console.error("Erreur globale:", err.stack);
  res.status(500).send({ success: false, message: 'Service momentanément indisponible' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});