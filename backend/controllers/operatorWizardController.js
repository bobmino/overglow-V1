import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';

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
    console.error('Get wizard status error:', error);
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

    const { providerType } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    operator.providerType = providerType;
    if (!operator.completedSteps.includes('providerType')) {
      operator.completedSteps.push('providerType');
    }

    await operator.save();
    res.json({ message: 'Provider type saved', operator });
  } catch (error) {
    console.error('Save provider type error:', error);
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

    const { publicName, description, location } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    operator.publicName = publicName;
    operator.description = description;
    if (location) {
      operator.location = {
        city: location.city,
        address: location.address,
        postalCode: location.postalCode,
        country: location.country || 'France',
        coordinates: location.coordinates || {},
      };
    }

    if (!operator.completedSteps.includes('publicInfo')) {
      operator.completedSteps.push('publicInfo');
    }

    await operator.save();
    res.json({ message: 'Public information saved', operator });
  } catch (error) {
    console.error('Save public info error:', error);
    res.status(500).json({ message: 'Failed to save public information' });
  }
};

// @desc    Save step 3: Photos
// @route   PUT /api/operator/wizard/photos
// @access  Private/Operator
const savePhotos = async (req, res) => {
  try {
    const { logo, gallery } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    if (logo) operator.photos.logo = logo;
    if (gallery && Array.isArray(gallery)) {
      operator.photos.gallery = gallery;
    }

    if (!operator.completedSteps.includes('photos')) {
      operator.completedSteps.push('photos');
    }

    await operator.save();
    res.json({ message: 'Photos saved', operator });
  } catch (error) {
    console.error('Save photos error:', error);
    res.status(500).json({ message: 'Failed to save photos' });
  }
};

// @desc    Save step 4: Company address
// @route   PUT /api/operator/wizard/address
// @access  Private/Operator
const saveAddress = async (req, res) => {
  try {
    const { companyAddress } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    if (companyAddress) {
      operator.companyAddress = {
        street: companyAddress.street,
        city: companyAddress.city,
        postalCode: companyAddress.postalCode,
        country: companyAddress.country || 'France',
        coordinates: companyAddress.coordinates || {},
      };
    }

    if (!operator.completedSteps.includes('address')) {
      operator.completedSteps.push('address');
    }

    await operator.save();
    res.json({ message: 'Address saved', operator });
  } catch (error) {
    console.error('Save address error:', error);
    res.status(500).json({ message: 'Failed to save address' });
  }
};

// @desc    Save step 5: Experiences
// @route   PUT /api/operator/wizard/experiences
// @access  Private/Operator
const saveExperiences = async (req, res) => {
  try {
    const { experiences } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    operator.experiences = experiences;

    if (!operator.completedSteps.includes('experiences')) {
      operator.completedSteps.push('experiences');
    }

    await operator.save();
    res.json({ message: 'Experiences saved', operator });
  } catch (error) {
    console.error('Save experiences error:', error);
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

    const { companyInfo, individualWithStatusInfo, individualWithoutStatusInfo } = req.body;

    // Sauvegarder selon le type de prestataire
    if (operator.providerType === 'company' && companyInfo) {
      operator.companyInfo = {
        companyName: companyInfo.companyName,
        registrationNumber: companyInfo.registrationNumber, // RC
        kbis: companyInfo.kbis,
        siret: companyInfo.siret,
        vatNumber: companyInfo.vatNumber,
        legalForm: companyInfo.legalForm,
        capital: companyInfo.capital,
        headquarters: companyInfo.headquarters,
      };
    } else if (operator.providerType === 'individual_with_status' && individualWithStatusInfo) {
      operator.individualWithStatusInfo = {
        firstName: individualWithStatusInfo.firstName,
        lastName: individualWithStatusInfo.lastName,
        status: individualWithStatusInfo.status,
        siret: individualWithStatusInfo.siret,
        apeCode: individualWithStatusInfo.apeCode,
        taxStatus: individualWithStatusInfo.taxStatus,
      };
    } else if (operator.providerType === 'individual_without_status' && individualWithoutStatusInfo) {
      operator.individualWithoutStatusInfo = {
        firstName: individualWithoutStatusInfo.firstName,
        lastName: individualWithoutStatusInfo.lastName,
        idNumber: individualWithoutStatusInfo.idNumber,
      };
    }

    if (!operator.completedSteps.includes('privateInfo')) {
      operator.completedSteps.push('privateInfo');
    }

    await operator.save();
    res.json({ message: 'Private information saved', operator });
  } catch (error) {
    console.error('Save private info error:', error);
    res.status(500).json({ message: 'Failed to save private information' });
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
    await operator.save();

    res.json({ 
      message: 'Wizard submitted successfully. Your application is under review.',
      operator 
    });
  } catch (error) {
    console.error('Submit wizard error:', error);
    res.status(500).json({ message: 'Failed to submit wizard' });
  }
};

// @desc    Get operator wizard data
// @route   GET /api/operator/wizard/data
// @access  Private/Operator
const getWizardData = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    res.json(operator);
  } catch (error) {
    console.error('Get wizard data error:', error);
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
  submitWizard,
  getWizardData,
};

