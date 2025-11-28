import OperatorOnboarding from '../models/operatorOnboardingModel.js';
import Operator from '../models/operatorModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { notifyOnboardingSubmitted } from '../utils/notificationService.js';

// Normalize operator status to valid enum values
const normalizeOperatorStatus = (operator) => {
  if (!operator || !operator.status) return;
  
  const validStatuses = ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'];
  if (!validStatuses.includes(operator.status)) {
    // Map old status values to new ones
    if (operator.status === 'Verified') {
      operator.status = 'Active';
    } else {
      operator.status = 'Pending'; // Default fallback
    }
  }
};

// Save operator with status normalization
const saveOperatorSafely = async (operator) => {
  normalizeOperatorStatus(operator);
  try {
    await operator.save();
  } catch (saveError) {
    // If save fails due to status validation, fix it and retry once
    if (saveError.name === 'ValidationError' && saveError.errors?.status) {
      operator.status = 'Active'; // Force to Active
      await operator.save({ validateBeforeSave: false }); // Skip validation this time
    } else {
      throw saveError; // Re-throw if it's a different error
    }
  }
};

// Calculate progress percentage
const calculateProgress = (onboarding) => {
  let completed = 0;
  const totalSteps = 6; // providerType, publicInfo, photos, address, experiences, privateInfo

  if (onboarding.providerType) completed++;
  if (onboarding.publicName && onboarding.experienceDescription && onboarding.experienceLocation?.city) completed++;
  if (onboarding.publicPhotos && onboarding.publicPhotos.length > 0) completed++;
  if (onboarding.companyAddress?.city) completed++;
  if (onboarding.experienceTypes && onboarding.experienceTypes.length > 0) completed++;
  
  // Private info depends on provider type
  if (onboarding.providerType === 'company' && onboarding.companyInfo?.registrationNumber) completed++;
  else if (onboarding.providerType === 'individual_with_status' && onboarding.individualWithStatusInfo?.registrationNumber) completed++;
  else if (onboarding.providerType === 'individual_without_status') completed++;

  return Math.round((completed / totalSteps) * 100);
};

// @desc    Get onboarding status
// @route   GET /api/operator/onboarding
// @access  Private/Operator
const getOnboarding = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });

    if (!onboarding) {
      // Create initial onboarding record
      onboarding = new OperatorOnboarding({
        operator: operator._id,
        user: req.user._id,
        onboardingStatus: 'in_progress',
        progress: 0,
        completedSteps: [],
      });
      await onboarding.save();
    }

    res.json(onboarding);
  } catch (error) {
    console.error('Get onboarding error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch onboarding status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update provider type step
// @route   PUT /api/operator/onboarding/provider-type
// @access  Private/Operator
const updateProviderType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerType } = req.body;

    // Validate providerType value
    if (!providerType || !['company', 'individual_with_status', 'individual_without_status'].includes(providerType)) {
      return res.status(400).json({ message: 'Invalid provider type. Must be one of: company, individual_with_status, individual_without_status' });
    }

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found. Please ensure you have registered as an operator.' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      onboarding = new OperatorOnboarding({
        operator: operator._id,
        user: req.user._id,
        onboardingStatus: 'in_progress',
        progress: 0,
        completedSteps: [],
      });
    }

    onboarding.providerType = providerType;
    
    // Mark step as completed
    const stepExists = onboarding.completedSteps.find(s => s.step === 'providerType');
    if (!stepExists) {
      onboarding.completedSteps.push({
        step: 'providerType',
        completedAt: new Date(),
      });
    }

    onboarding.progress = calculateProgress(onboarding);
    
    // Ensure onboardingStatus is set
    if (!onboarding.onboardingStatus) {
      onboarding.onboardingStatus = 'in_progress';
    }
    
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update provider type error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return more detailed error message
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update provider type',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update public information
// @route   PUT /api/operator/onboarding/public-info
// @access  Private/Operator
const updatePublicInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { publicName, experienceLocation, experienceDescription } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Please complete provider type step first' });
    }

    onboarding.publicName = publicName;
    onboarding.experienceLocation = experienceLocation;
    onboarding.experienceDescription = experienceDescription;

    // Update operator company name if public name is set
    if (publicName && operator.companyName !== publicName) {
      operator.companyName = publicName;
      await saveOperatorSafely(operator);
    }

    // Mark step as completed
    const stepExists = onboarding.completedSteps.find(s => s.step === 'publicInfo');
    if (!stepExists) {
      onboarding.completedSteps.push({
        step: 'publicInfo',
        completedAt: new Date(),
      });
    }

    onboarding.progress = calculateProgress(onboarding);
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update public info error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update public information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update photos
// @route   PUT /api/operator/onboarding/photos
// @access  Private/Operator
const updatePhotos = async (req, res) => {
  try {
    const { photos } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Please complete previous steps first' });
    }

    onboarding.publicPhotos = Array.isArray(photos) ? photos : [];

    // Mark step as completed if photos are uploaded
    if (onboarding.publicPhotos.length > 0) {
      const stepExists = onboarding.completedSteps.find(s => s.step === 'photos');
      if (!stepExists) {
        onboarding.completedSteps.push({
          step: 'photos',
          completedAt: new Date(),
        });
      }
    }

    onboarding.progress = calculateProgress(onboarding);
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update photos error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update photos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update company address
// @route   PUT /api/operator/onboarding/address
// @access  Private/Operator
const updateAddress = async (req, res) => {
  try {
    const { companyAddress } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Please complete previous steps first' });
    }

    onboarding.companyAddress = companyAddress;

    // Mark step as completed
    const stepExists = onboarding.completedSteps.find(s => s.step === 'address');
    if (!stepExists) {
      onboarding.completedSteps.push({
        step: 'address',
        completedAt: new Date(),
      });
    }

    onboarding.progress = calculateProgress(onboarding);
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update address error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update experience types
// @route   PUT /api/operator/onboarding/experiences
// @access  Private/Operator
const updateExperiences = async (req, res) => {
  try {
    const { experienceTypes } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Please complete previous steps first' });
    }

    onboarding.experienceTypes = Array.isArray(experienceTypes) ? experienceTypes : [];

    // Mark step as completed
    const stepExists = onboarding.completedSteps.find(s => s.step === 'experiences');
    if (!stepExists) {
      onboarding.completedSteps.push({
        step: 'experiences',
        completedAt: new Date(),
      });
    }

    onboarding.progress = calculateProgress(onboarding);
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update experiences error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update experiences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update private information
// @route   PUT /api/operator/onboarding/private-info
// @access  Private/Operator
const updatePrivateInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      companyInfo, 
      individualWithStatusInfo, 
      individualWithoutStatusInfo,
      bankInfo,
      privateContact,
      documents 
    } = req.body;

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    let onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Please complete previous steps first' });
    }

    if (!onboarding.providerType) {
      return res.status(400).json({ message: 'Please select provider type first' });
    }

    // Update based on provider type
    if (onboarding.providerType === 'company') {
      onboarding.companyInfo = companyInfo;
    } else if (onboarding.providerType === 'individual_with_status') {
      onboarding.individualWithStatusInfo = individualWithStatusInfo;
    } else if (onboarding.providerType === 'individual_without_status') {
      onboarding.individualWithoutStatusInfo = individualWithoutStatusInfo;
    }

    onboarding.bankInfo = bankInfo;
    onboarding.privateContact = privateContact;
    onboarding.documents = Array.isArray(documents) ? documents : [];

    // Mark step as completed
    const stepExists = onboarding.completedSteps.find(s => s.step === 'privateInfo');
    if (!stepExists) {
      onboarding.completedSteps.push({
        step: 'privateInfo',
        completedAt: new Date(),
      });
    }

    onboarding.progress = calculateProgress(onboarding);
    await onboarding.save();

    res.json(onboarding);
  } catch (error) {
    console.error('Update private info error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update private information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit onboarding for approval
// @route   POST /api/operator/onboarding/submit
// @access  Private/Operator
const submitOnboarding = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
    
    if (!onboarding) {
      return res.status(400).json({ message: 'Onboarding not started' });
    }

    // Validate all required fields are filled
    if (!onboarding.providerType) {
      return res.status(400).json({ message: 'Please complete provider type step' });
    }
    if (!onboarding.publicName || !onboarding.experienceDescription || !onboarding.experienceLocation?.city) {
      return res.status(400).json({ message: 'Please complete public information step' });
    }
    if (!onboarding.companyAddress?.city) {
      return res.status(400).json({ message: 'Please complete address step' });
    }
    if (!onboarding.experienceTypes || onboarding.experienceTypes.length === 0) {
      return res.status(400).json({ message: 'Please complete experiences step' });
    }

    // Validate private info based on provider type
    if (onboarding.providerType === 'company' && !onboarding.companyInfo?.registrationNumber) {
      return res.status(400).json({ message: 'Please complete company information' });
    }
    if (onboarding.providerType === 'individual_with_status' && !onboarding.individualWithStatusInfo?.registrationNumber) {
      return res.status(400).json({ message: 'Please complete individual status information' });
    }

    // Update status
    onboarding.onboardingStatus = 'pending_approval';
    onboarding.progress = 100;
    await onboarding.save();

    // Update operator status to Pending
    operator.status = 'Pending';
    await saveOperatorSafely(operator);

    // Notify all admins of new onboarding submission
    const adminUsers = await User.find({ role: 'Admin' });
    const adminIds = adminUsers.map(admin => admin._id);
    if (adminIds.length > 0) {
      await notifyOnboardingSubmitted(onboarding, adminIds);
    }

    res.json({ 
      message: 'Onboarding submitted successfully. Waiting for admin approval.',
      onboarding 
    });
  } catch (error) {
    console.error('Submit onboarding error:', error);
    res.status(500).json({ message: 'Failed to submit onboarding' });
  }
};

export {
  getOnboarding,
  updateProviderType,
  updatePublicInfo,
  updatePhotos,
  updateAddress,
  updateExperiences,
  updatePrivateInfo,
  submitOnboarding,
};

