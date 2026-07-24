import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';
import { sanitizeBody } from '../utils/sanitizeBody.js';
import { logger } from '../utils/logger.js';
import {
  ACTIVITY_SECTORS,
  resolveRequirements,
  mapProviderTypeToLegalForm,
} from '../config/operatorComplianceMatrix.js';

const WIZARD_PROVIDER_FIELDS = ['providerType'];
const WIZARD_PUBLIC_FIELDS = ['publicName', 'description', 'location'];
const WIZARD_PHOTO_FIELDS = ['logo', 'gallery'];
const WIZARD_ADDRESS_FIELDS = ['companyAddress'];
const WIZARD_EXPERIENCE_FIELDS = ['experiences', 'specialties', 'languages'];
const WIZARD_PRIVATE_FIELDS = [
  'companyInfo',
  'individualWithStatusInfo',
  'individualWithoutStatusInfo',
  'activitySectors',
  'legalIdentity',
  'complianceDocuments',
];

// @desc    Get operator wizard status
// @route   GET /api/operator/wizard/status
// @access  Private/Operator
const getWizardStatus = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    res.json({
      isFormCompleted: operator.isFormCompleted,
      completedSteps: operator.completedSteps || [],
      providerType: operator.providerType,
      status: operator.status,
    });
  } catch (error) {
    logger.error('Get wizard status error:', error);
    res.status(500).json({ message: 'Failed to fetch wizard status' });
  }
};

// @desc    Save step 1: Provider type
// @route   PUT /api/operator/wizard/provider-type
// @access  Private/Operator
const saveProviderType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerType } = sanitizeBody(req.body, WIZARD_PROVIDER_FIELDS);

    let operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      operator = await Operator.create({
        user: req.user._id,
        publicName: req.user.name || 'Mon activité',
        status: 'Pending',
        isFormCompleted: false,
        completedSteps: [],
        location: { country: 'Maroc' },
      });
    }

    operator.providerType = providerType;
    if (!operator.completedSteps.includes('providerType')) {
      operator.completedSteps.push('providerType');
    }

    await operator.save();
    res.json({ message: 'Provider type saved', operator });
  } catch (error) {
    logger.error('Save provider type error:', error);
    res.status(500).json({ message: 'Failed to save provider type' });
  }
};

// @desc    Save step 2: Public information
// @route   PUT /api/operator/wizard/public-info
// @access  Private/Operator
const savePublicInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { publicName, description, location } = sanitizeBody(req.body, WIZARD_PUBLIC_FIELDS);

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    operator.publicName = publicName;
    operator.description = description;
    if (location) {
      const coords = location.coordinates || {};
      operator.location = {
        city: location.city,
        address: location.address,
        postalCode: location.postalCode,
        country: location.country || 'Maroc',
        coordinates: {
          ...(Number.isFinite(Number(coords.lat)) ? { lat: Number(coords.lat) } : {}),
          ...(Number.isFinite(Number(coords.lng)) ? { lng: Number(coords.lng) } : {}),
        },
      };
    }

    if (!operator.completedSteps.includes('publicInfo')) {
      operator.completedSteps.push('publicInfo');
    }

    await operator.save();
    res.json({ message: 'Public information saved', operator });
  } catch (error) {
    logger.error('Save public info error:', error);
    res.status(500).json({ message: 'Failed to save public information' });
  }
};

// @desc    Save step 3: Photos
// @route   PUT /api/operator/wizard/photos
// @access  Private/Operator
const savePhotos = async (req, res) => {
  try {
    const { logo, gallery } = sanitizeBody(req.body, WIZARD_PHOTO_FIELDS);

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    if (!operator.photos) {
      operator.photos = { logo: undefined, gallery: [] };
    }
    if (logo) operator.photos.logo = logo;
    if (Array.isArray(gallery)) {
      operator.photos.gallery = gallery;
    }

    if (!operator.completedSteps.includes('photos')) {
      operator.completedSteps.push('photos');
    }

    await operator.save();
    res.json({ message: 'Photos saved', operator });
  } catch (error) {
    logger.error('Save photos error:', error);
    res.status(500).json({ message: 'Failed to save photos' });
  }
};

// @desc    Save step 4: Company address
// @route   PUT /api/operator/wizard/address
// @access  Private/Operator
const saveAddress = async (req, res) => {
  try {
    const { companyAddress } = sanitizeBody(req.body, WIZARD_ADDRESS_FIELDS);

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    if (companyAddress) {
      const coords = companyAddress.coordinates || {};
      operator.companyAddress = {
        street: companyAddress.street,
        city: companyAddress.city,
        postalCode: companyAddress.postalCode,
        country: companyAddress.country || 'Maroc',
        coordinates: {
          ...(Number.isFinite(Number(coords.lat)) ? { lat: Number(coords.lat) } : {}),
          ...(Number.isFinite(Number(coords.lng)) ? { lng: Number(coords.lng) } : {}),
        },
      };
    }

    if (!operator.completedSteps.includes('address')) {
      operator.completedSteps.push('address');
    }

    await operator.save();
    res.json({ message: 'Address saved', operator });
  } catch (error) {
    logger.error('Save address error:', error);
    res.status(500).json({ message: 'Failed to save address' });
  }
};

// @desc    Save step 5: Experiences
// @route   PUT /api/operator/wizard/experiences
// @access  Private/Operator
const saveExperiences = async (req, res) => {
  try {
    const { experiences, specialties, languages } = sanitizeBody(req.body, WIZARD_EXPERIENCE_FIELDS);

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    if (experiences !== undefined) {
      operator.experiences = experiences;
    }

    if (Array.isArray(specialties)) {
      operator.specialties = specialties.filter(Boolean);
    }

    if (Array.isArray(languages)) {
      operator.languages = languages
        .map((l) => String(l || '').trim().toLowerCase())
        .filter(Boolean);
    }

    if (!operator.completedSteps.includes('experiences')) {
      operator.completedSteps.push('experiences');
    }

    await operator.save();
    const populated = await Operator.findById(operator._id).populate(
      'specialties',
      'slug label kind productTypes'
    );
    res.json({ message: 'Experiences saved', operator: populated });
  } catch (error) {
    logger.error('Save experiences error:', error);
    res.status(500).json({ message: 'Failed to save experiences' });
  }
};

// @desc    Save step 6: Private information
// @route   PUT /api/operator/wizard/private-info
// @access  Private/Operator
const savePrivateInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const {
      companyInfo,
      individualWithStatusInfo,
      individualWithoutStatusInfo,
      activitySectors,
      legalIdentity,
      complianceDocuments,
    } = sanitizeBody(req.body, WIZARD_PRIVATE_FIELDS);

    // Sauvegarder selon le type de prestataire
    if (operator.providerType === 'company' && companyInfo) {
      const capitalRaw = companyInfo.capital;
      const capitalNum =
        capitalRaw === '' || capitalRaw === null || capitalRaw === undefined
          ? undefined
          : Number(capitalRaw);
      operator.companyInfo = {
        companyName: companyInfo.companyName,
        registrationNumber: companyInfo.registrationNumber || companyInfo.rcNumber,
        kbis: companyInfo.kbis,
        siret: companyInfo.siret,
        vatNumber: companyInfo.vatNumber,
        legalForm: companyInfo.legalForm,
        capital: Number.isFinite(capitalNum) ? capitalNum : undefined,
        headquarters: companyInfo.headquarters,
        ice: companyInfo.ice,
        rcCity: companyInfo.rcCity,
        ifNumber: companyInfo.ifNumber,
        taxId: companyInfo.taxId,
      };
    } else if (operator.providerType === 'individual_with_status' && individualWithStatusInfo) {
      operator.individualWithStatusInfo = {
        firstName: individualWithStatusInfo.firstName,
        lastName: individualWithStatusInfo.lastName,
        status: individualWithStatusInfo.status,
        siret: individualWithStatusInfo.siret,
        apeCode: individualWithStatusInfo.apeCode,
        taxStatus: individualWithStatusInfo.taxStatus,
        ice: individualWithStatusInfo.ice,
        cnieNumber: individualWithStatusInfo.cnieNumber,
        ifNumber: individualWithStatusInfo.ifNumber,
        taxId: individualWithStatusInfo.taxId,
      };
    } else if (operator.providerType === 'individual_without_status' && individualWithoutStatusInfo) {
      operator.individualWithoutStatusInfo = {
        firstName: individualWithoutStatusInfo.firstName,
        lastName: individualWithoutStatusInfo.lastName,
        idNumber: individualWithoutStatusInfo.idNumber || individualWithoutStatusInfo.cnieNumber,
        cnieNumber: individualWithoutStatusInfo.cnieNumber || individualWithoutStatusInfo.idNumber,
      };
    }

    if (Array.isArray(activitySectors)) {
      operator.activitySectors = activitySectors.map(String).filter(Boolean);
    }

    if (legalIdentity && typeof legalIdentity === 'object') {
      operator.legalIdentity = {
        ...(operator.legalIdentity?.toObject?.() || operator.legalIdentity || {}),
        ...Object.fromEntries(
          Object.entries(legalIdentity).map(([k, v]) => [
            k,
            v === null || v === undefined ? undefined : String(v).trim(),
          ])
        ),
      };
    }

    if (Array.isArray(complianceDocuments)) {
      const existing = Array.isArray(operator.complianceDocuments)
        ? operator.complianceDocuments
        : [];
      const byType = new Map(existing.map((d) => [d.type, d]));
      complianceDocuments.forEach((doc) => {
        if (!doc?.type) return;
        const prev = byType.get(doc.type)?.toObject?.() || byType.get(doc.type) || {};
        const nextStatus = doc.fileUrl
          ? (doc.status && doc.status !== 'missing' ? doc.status : 'uploaded')
          : 'missing';
        byType.set(doc.type, {
          ...prev,
          type: doc.type,
          fileUrl: doc.fileUrl || prev.fileUrl || '',
          number: doc.number !== undefined ? doc.number : prev.number,
          issuedAt: doc.issuedAt || prev.issuedAt,
          expiresAt: doc.expiresAt || prev.expiresAt,
          status: nextStatus,
        });
      });
      operator.complianceDocuments = [...byType.values()];
    }

    if (operator.activitySectors?.length || operator.complianceDocuments?.length) {
      operator.complianceStatus = 'submitted';
    }

    if (!operator.completedSteps.includes('privateInfo')) {
      operator.completedSteps.push('privateInfo');
    }

    await operator.save();
    res.json({ message: 'Private information saved', operator });
  } catch (error) {
    logger.error('Save private info error:', error);
    res.status(500).json({ message: 'Failed to save private information' });
  }
};

// @desc    Compliance requirements for selected sectors
// @route   GET /api/operator/wizard/compliance/requirements
// @access  Private/Operator
const getComplianceRequirements = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id }).select('providerType activitySectors');
    const sectorsParam = req.query.sectors;
    let sectors = [];
    if (typeof sectorsParam === 'string' && sectorsParam.trim()) {
      sectors = sectorsParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(operator?.activitySectors)) {
      sectors = operator.activitySectors;
    }

    const requirements = resolveRequirements({
      providerType: operator?.providerType || req.query.providerType,
      sectors,
    });

    res.json({
      sectorsCatalog: ACTIVITY_SECTORS,
      legalForm: mapProviderTypeToLegalForm(operator?.providerType || req.query.providerType),
      requirements,
    });
  } catch (error) {
    logger.error('Get compliance requirements error:', error);
    res.status(500).json({ message: 'Failed to resolve compliance requirements' });
  }
};

// @desc    Submit complete wizard
// @route   POST /api/operator/wizard/submit
// @access  Private/Operator
const submitWizard = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    // Vérifier que toutes les étapes sont complétées
    const requiredSteps = ['providerType', 'publicInfo', 'photos', 'address', 'experiences', 'privateInfo'];
    const missingSteps = requiredSteps.filter(step => !operator.completedSteps.includes(step));

    if (missingSteps.length > 0) {
      return res.status(400).json({ 
        message: 'Please complete all steps before submitting',
        missingSteps 
      });
    }

    // Marquer le formulaire comme complété et passer en "Under Review"
    operator.isFormCompleted = true;
    operator.status = 'Under Review';
    if (operator.complianceStatus === 'draft' || !operator.complianceStatus) {
      operator.complianceStatus = 'in_review';
    } else if (operator.complianceStatus === 'submitted') {
      operator.complianceStatus = 'in_review';
    }
    await operator.save();

    res.json({ 
      message: 'Wizard submitted successfully. Your application is under review.',
      operator 
    });
  } catch (error) {
    logger.error('Submit wizard error:', error);
    res.status(500).json({ message: 'Failed to submit wizard' });
  }
};

// @desc    Get operator wizard data
// @route   GET /api/operator/wizard/data
// @access  Private/Operator
const getWizardData = async (req, res) => {
  try {
    let operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      // Profil manquant (inscription partielle / upgrade) — créer pour débloquer le wizard
      operator = await Operator.create({
        user: req.user._id,
        publicName: req.user.name || 'Mon activité',
        description: '',
        status: 'Pending',
        isFormCompleted: false,
        completedSteps: [],
        location: { country: 'Maroc' },
      });
      logger.info('Auto-created operator profile for wizard', { userId: req.user._id });
    }

    res.json(operator);
  } catch (error) {
    logger.error('Get wizard data error:', error);
    res.status(500).json({ message: 'Failed to fetch wizard data' });
  }
};

export {
  getWizardStatus,
  saveProviderType,
  savePublicInfo,
  savePhotos,
  saveAddress,
  saveExperiences,
  savePrivateInfo,
  getComplianceRequirements,
  submitWizard,
  getWizardData,
};

