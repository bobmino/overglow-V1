import express from 'express';
import { getHomepageLayout } from '../controllers/homepageController.js'; // Importez le contrôleur

const router = express.Router();

// Liez la route à la fonction du contrôleur
router.get('/layout', getHomepageLayout);

export default router;