import express from 'express';
import { check } from 'express-validator';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublishedProducts,
  getProductById,
  webhookImportProduct,
} from '../controllers/productController.js';
import { createSchedule, getSchedules } from '../controllers/scheduleController.js';
import { createReview, getProductReviews } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { cache, clearCache } from '../middleware/cacheMiddleware.js';
import notificationHub from '../services/notificationHub.js';

const router = express.Router();

const productValidationRules = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('duration', 'Duration is required').not().isEmpty(),
  check('price', 'Price is required').not().isEmpty(),
  check('price', 'Price must be a valid number').isFloat({ min: 0 }),
  check('price').custom((value, { req }) => {
    const numericPrice = Number(value);
    if (!Number.isFinite(numericPrice)) {
      throw new Error('Price must be a valid number');
    }
    if (req.body.status === 'Published' && numericPrice <= 0) {
      throw new Error('Published products must have a price greater than 0');
    }
    return true;
  }),
];

// Validation rules for update (all fields optional except price validation)
const productUpdateValidationRules = [
  check('title', 'Title must not be empty').optional().not().isEmpty(),
  check('description', 'Description must not be empty').optional().not().isEmpty(),
  check('category', 'Category must not be empty').optional().not().isEmpty(),
  check('city', 'City must not be empty').optional().not().isEmpty(),
  check('address', 'Address must not be empty').optional().not().isEmpty(),
  check('duration', 'Duration must not be empty').optional().not().isEmpty(),
  check('price', 'Price must be a valid number').optional().isFloat({ min: 0 }),
  check('price').optional().custom((value, { req }) => {
    if (value !== undefined && value !== null && value !== '') {
      const numericPrice = Number(value);
      if (!Number.isFinite(numericPrice)) {
        throw new Error('Price must be a valid number');
      }
      if (req.body.status === 'Published' && numericPrice <= 0) {
        throw new Error('Published products must have a price greater than 0');
      }
    }
    return true;
  }),
];

router.route('/')
  .get(cache(900), getPublishedProducts)
  .post(
    protect,
    authorize('Opérateur', 'Admin'), // Allow both operators and admins
    productValidationRules,
    createProduct
  );

router.get('/my-products', protect, authorize('Opérateur'), getMyProducts);
router.post('/webhook/import', webhookImportProduct);

router.post('/webhook/clear-cache', async (req, res) => {
  // Appel de notre fonction globale d'invalidation
  const success = await clearCache('cache:*');
  if (success) {
    return res.status(200).json({ message: "Cache global vidé avec succès." });
  }
  return res.status(500).json({ error: "Erreur lors du nettoyage du cache Redis." });
});

// Route de Test Automatique pour la synchronisation de notification et envoi d'email
router.get('/test-sync-notification', (req, res) => {
  const mockPayload = {
    to: 'bob.mino@gmail.com',
    booking: {
      _id: '66a1a2b3c4d5e6f7a8b9c0d1',
      totalAmount: 150.00,
      numberOfTickets: 2,
      schedule: {
        date: new Date(),
        time: '10:00',
        product: {
          title: 'Visite VIP du Jardin Majorelle',
          operatorWhatsapp: '212600000000',
          operator: 'operator_id_123',
        }
      }
    },
    user: {
      name: 'Bob Mino',
      email: 'bob.mino@gmail.com'
    },
    whatsappLink: '212600000000'
  };

  // Dispatch de l'événement en arrière-plan
  notificationHub.dispatch('BOOKING_SUCCESS', mockPayload);

  res.status(200).json({
    success: true,
    message: "Événement BOOKING_SUCCESS dispatché avec succès pour bob.mino@gmail.com. Vérifiez les logs backend.",
  });
});

router.route('/:id')
  .get(getProductById)
  .put(
    protect,
    authorize('Opérateur', 'Admin'), // Allow both operators and admins
    productUpdateValidationRules,
    updateProduct
  )
  .delete(protect, authorize('Opérateur', 'Admin'), deleteProduct);

// Nested routes
router.route('/:productId/schedules')
  .post(protect, authorize('Opérateur', 'Admin'), createSchedule)
  .get(getSchedules);

router.route('/:productId/reviews')
  .post(protect, createReview)
  .get(getProductReviews);

export default router;
