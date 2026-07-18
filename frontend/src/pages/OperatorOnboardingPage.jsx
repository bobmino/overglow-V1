import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Ancien flux 6 étapes — fusionné dans OperatorWizardPage (3 étapes).
 * Conservé comme redirect pour les liens / emails historiques.
 */
const OperatorOnboardingPage = () => <Navigate to="/operator/wizard" replace />;

export default OperatorOnboardingPage;
