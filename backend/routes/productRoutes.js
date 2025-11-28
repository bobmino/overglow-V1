import express from 'express';
import { check } from 'express-validator';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublishedProducts,
  getProductById,
} from '../controllers/productController.js';
import { createSchedule, getSchedules } from '../controllers/scheduleController.js';
import { createReview, getProductReviews } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

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
  .get(getPublishedProducts)
  .post(
    protect,
    authorize('Opérateur', 'Admin'), // Allow both operators and admins
    productValidationRules,
    createProduct
  );

router.get('/my-products', protect, authorize('Opérateur'), getMyProducts);

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
  .post(protect, authorize('Opérateur'), createSchedule)
  .get(getSchedules);

router.route('/:productId/reviews')
  .post(protect, createReview)
  .get(getProductReviews);

export default router;
