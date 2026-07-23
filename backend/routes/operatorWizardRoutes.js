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
    check('publicName', 'Le nom public est obligatoire').not().isEmpty().trim(),
    check('description', 'La description doit contenir au moins 50 caractères')
      .not()
      .isEmpty()
      .trim()
      .isLength({ min: 50 }),
    check('location.city', 'La ville est obligatoire').not().isEmpty().trim(),
  ],
  savePublicInfo
);

router.put('/photos', savePhotos);

router.put(
  '/address',
  [
    check('companyAddress.street', 'La rue / adresse est obligatoire').not().isEmpty().trim(),
    check('companyAddress.city', 'La ville est obligatoire').not().isEmpty().trim(),
    check('companyAddress.postalCode', 'Le code postal est obligatoire').optional({ checkFalsy: true }),
  ],
  saveAddress
);

router.put(
  '/experiences',
  [
    check('experiences', 'Décrivez vos expériences (min. 20 caractères)')
      .not()
      .isEmpty()
      .trim()
      .isLength({ min: 20 }),
  ],
  saveExperiences
);

router.put('/private-info', savePrivateInfo);

router.post('/submit', submitWizard);

export default router;

