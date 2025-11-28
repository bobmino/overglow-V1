import Operator from '../models/operatorModel.js';

/**
 * Middleware to check if operator has completed the wizard
 * Redirects to wizard if form is not completed
 */
export const checkWizardCompleted = async (req, res, next) => {
  try {
    // Only apply to operators
    if (req.user.role !== 'Opérateur') {
      return next();
    }

    const operator = await Operator.findOne({ user: req.user._id });
    
    if (!operator) {
      // If no operator profile exists, allow access (will be created during wizard)
      return next();
    }

    // If form is not completed, redirect to wizard
    if (!operator.isFormCompleted) {
      return res.status(403).json({ 
        message: 'Please complete the operator registration form',
        redirectTo: '/operator/wizard',
        isFormCompleted: false,
        completedSteps: operator.completedSteps || [],
      });
    }

    // If form is completed but status is Pending or Under Review, allow access to dashboard
    // but show a message about waiting for approval
    next();
  } catch (error) {
    console.error('Check wizard completed error:', error);
    next();
  }
};

/**
 * Middleware to check if operator can access dashboard
 * Blocks access if status is Rejected
 */
export const checkOperatorStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'Opérateur') {
      return next();
    }

    const operator = await Operator.findOne({ user: req.user._id });
    
    if (!operator) {
      return next();
    }

    if (operator.status === 'Rejected') {
      return res.status(403).json({ 
        message: 'Your operator account has been rejected',
        rejectionReason: operator.rejectionReason,
        status: operator.status,
      });
    }

    if (operator.status === 'Suspended') {
      return res.status(403).json({ 
        message: 'Your operator account has been suspended',
        status: operator.status,
      });
    }

    next();
  } catch (error) {
    console.error('Check operator status error:', error);
    next();
  }
};

