import express from 'express';
import { check } from 'express-validator';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getWizardStatus,
  saveProviderType,
  savePublicInfo,
  savePhotos,
  saveAddress,
  saveExperiences,
  savePrivateInfo,
  submitWizard,
  getWizardData,
} from '../controllers/operatorWizardController.js';

const router = express.Router();

// All routes require authentication and operator role
router.use(protect);
router.use(authorize('Opérateur'));

router.get('/status', getWizardStatus);
router.get('/data', getWizardData);

router.put(
  '/provider-type',
  [check('providerType', 'Provider type is required').isIn(['company', 'individual_with_status', 'individual_without_status'])],
  saveProviderType
);

router.put(
  '/public-info',
  [
    check('publicName', 'Public name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty().isLength({ min: 100 }),
    check('location.city', 'City is required').not().isEmpty(),
  ],
  savePublicInfo
);

router.put('/photos', savePhotos);

router.put(
  '/address',
  [
    check('companyAddress.street', 'Street is required').not().isEmpty(),
    check('companyAddress.city', 'City is required').not().isEmpty(),
    check('companyAddress.postalCode', 'Postal code is required').not().isEmpty(),
  ],
  saveAddress
);

router.put(
  '/experiences',
  [check('experiences', 'Experiences description is required').not().isEmpty()],
  saveExperiences
);

router.put('/private-info', savePrivateInfo);

router.post('/submit', submitWizard);

export default router;

