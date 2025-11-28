import OperatorOnboarding from '../models/operatorOnboardingModel.js';
import Operator from '../models/operatorModel.js';

/**
 * Middleware to check if operator has completed onboarding
 * Redirects to onboarding page if not completed
 */
export const requireOnboarding = async (req, res, next) => {
  try {
    // Only apply to operators
    if (req.user.role !== 'Opérateur') {
      return next();
    }

    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });

    // If no onboarding record exists or status is not 'approved', redirect to onboarding
    if (!onboarding || onboarding.onboardingStatus !== 'approved') {
      return res.status(403).json({ 
        message: 'Onboarding not completed',
        requiresOnboarding: true,
        onboardingStatus: onboarding?.onboardingStatus || 'in_progress',
        progress: onboarding?.progress || 0,
      });
    }

    // Check if operator is approved
    if (operator.status !== 'Active') {
      return res.status(403).json({ 
        message: 'Operator account is pending approval',
        requiresApproval: true,
      });
    }

    next();
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    res.status(500).json({ message: 'Error checking onboarding status' });
  }
};

/**
 * Middleware to check onboarding status (doesn't block, just adds info to req)
 */
export const checkOnboarding = async (req, res, next) => {
  try {
    if (req.user.role === 'Opérateur') {
      const operator = await Operator.findOne({ user: req.user._id });
      if (operator) {
        const onboarding = await OperatorOnboarding.findOne({ operator: operator._id });
        req.onboarding = onboarding;
        req.operator = operator;
      }
    }
    next();
  } catch (error) {
    // Don't block on error, just continue
    next();
  }
};

