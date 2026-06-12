// backend/middleware/cacheMiddleware.js
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Initialisation du client Upstash Redis via HTTP (Stateless pour Serverless)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Middleware de Cache global avec Fallback automatique
 * @param {number} duration - Durée de vie du cache en secondes
 */
export const cache = (duration = 900) => {
  return async (req, res, next) => {
    // On ne met en cache que les requêtes GET
    if (req.method !== 'GET') return next();

    // Génération d'une clé unique incluant la langue si disponible dans les headers
    const lang = req.headers['accept-language'] || 'fr';
    const cacheKey = `cache:${lang}:${req.originalUrl}`;

    try {
      // Tentative de récupération dans le cache Upstash
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Si MISS, on intercepte la méthode res.json pour stocker la réponse avant envoi
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json;

      res.json = function (data) {
        res.json = originalJson;
        
        // Sauvegarde asynchrone dans Redis en arrière-plan sans bloquer la requête
        redis.set(cacheKey, data, { ex: duration }).catch((err) => {
          console.error(`[Redis Error] Échec de l'écriture pour la clé ${cacheKey}:`, err);
        });

        return res.json(data);
      };

      next();
    } catch (error) {
      // FAIL-SAFE : Si Upstash est indisponible, on loggue l'erreur et on passe à la DB
      console.error('[Redis Error] Erreur critique de lecture du cache, fallback vers la DB:', error);
      res.setHeader('X-Cache', 'BYPASS_ERROR');
      next();
    }
  };
};

/**
 * Invalidation globale des clés de cache par préfixe
 * @param {string} prefix - Le préfixe à supprimer (ex: "cache:")
 */
export const clearCache = async (prefix = 'cache:*') => {
  try {
    // Recherche et suppression des clés correspondantes au pattern
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: prefix, count: 100 });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
    
    console.log(`[Redis Cache] Invalidation réussie pour le pattern: ${prefix}`);
    return true;
  } catch (error) {
    console.error(`[Redis Error] Échec de l'invalidation du cache pour le préfixe ${prefix}:`, error);
    return false;
  }
};
