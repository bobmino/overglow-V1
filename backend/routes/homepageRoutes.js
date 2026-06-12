import express from 'express';
import { getHomepageLayout } from '../controllers/homepageController.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Wrapper Fail-Safe global pour la route
router.get('/layout', async (req, res) => {
  try {
    // 1. Instanciation du middleware de cache
    const cacheMiddleware = cache(300);

    // 2. Exécution manuelle du middleware pour capturer ses erreurs potentielles
    await new Promise((resolve, reject) => {
      cacheMiddleware(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Si le cache a fait un HIT, il a déjà envoyé la réponse (headersSent = true)
    if (res.headersSent) {
      return;
    }

    // 3. Exécution du contrôleur avec protection
    await getHomepageLayout(req, res);

  } catch (error) {
    console.error('[Homepage Route Fail-Safe] Erreur critique interceptée:', error);
    
    // En cas de crash du cache ou du contrôleur, on renvoie une structure vide mais valide (200 OK)
    // Cela évite l'écran blanc ou le crash de l'app Front-End
    if (!res.headersSent) {
      res.status(200).json({
        success: false,
        message: "Mode dégradé activé suite à une erreur serveur",
        performance: {
          responseTimeMs: 0,
          cached: false
        },
        layout: {
          topDestinations: [],
          offers: {
            national: [],
            international: [],
            insolite: []
          },
          topCircuits: [],
          topServices: [],
          topProducts: []
        }
      });
    }
  }
});

export default router;
