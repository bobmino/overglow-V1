import express from 'express';
import { check } from 'express-validator';
import {
  getOnboarding,
  updateProviderType,
  updatePublicInfo,
  updatePhotos,
  updateAddress,
  updateExperiences,
  updatePrivateInfo,
  submitOnboarding,
} from '../controllers/onboardingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and operator role
router.use(protect);
router.use(authorize('Opérateur'));

router.get('/', getOnboarding);

router.put('/provider-type', [
  check('providerType', 'Provider type is required').isIn(['company', 'individual_with_status', 'individual_without_status']),
], updateProviderType);

router.put('/public-info', [
  check('publicName', 'Public name is required').not().isEmpty(),
  check('experienceDescription', 'Experience description is required').not().isEmpty(),
  check('experienceDescription', 'Experience description must be at least 100 characters').isLength({ min: 100 }),
  check('experienceLocation.city', 'Experience location city is required').not().isEmpty(),
], updatePublicInfo);

router.put('/photos', [
  check('photos', 'Photos must be an array').optional().isArray(),
], updatePhotos);

router.put('/address', [
  check('companyAddress.city', 'City is required').not().isEmpty(),
], updateAddress);

router.put('/experiences', [
  check('experienceTypes', 'Experience types must be an array').isArray(),
  check('experienceTypes', 'At least one experience type is required').custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('At least one experience type is required');
    }
    return true;
  }),
], updateExperiences);

router.put('/private-info', [
  check('bankInfo.accountNumber', 'Bank account number is required').optional().not().isEmpty(),
  check('privateContact.phone', 'Phone number is required').optional().not().isEmpty(),
], updatePrivateInfo);

router.post('/submit', submitOnboarding);

export default router;

