import mongoose from 'mongoose';

const operatorOnboardingSchema = mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Operator',
    unique: true, // unique: true crée automatiquement un index, pas besoin de schema.index()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  
  // TYPE DE PRESTATAIRE
  providerType: {
    type: String,
    enum: ['company', 'individual_with_status', 'individual_without_status'],
    required: false, // Not required initially, will be set during onboarding
  },
  
  // INFORMATIONS PUBLIQUES
  // Vos informations
  publicName: {
    type: String,
    required: false, // Will be set during onboarding step 2
  },
  experienceLocation: {
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  experienceDescription: {
    type: String,
    required: false, // Will be set during onboarding step 2
    // minlength validation is handled by express-validator in routes, not here
  },
  
  // Vos photos
  publicPhotos: [{
    url: String,
    caption: String,
  }],
  
  // Adresse de la société
  companyAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  
  // Expériences (liste des types d'expériences proposées)
  experienceTypes: [{
    type: String,
  }],
  
  // INFORMATIONS PRIVÉES
  // Pour personne morale (company)
  companyInfo: {
    companyName: String,
    registrationNumber: String, // RC, KABIS, etc.
    registrationType: String, // Type de numéro d'enregistrement
    taxId: String, // Numéro TVA
    legalForm: String, // Forme juridique
    registrationDate: Date,
    registrationAuthority: String, // Autorité d'enregistrement
  },
  
  // Pour personne physique avec statut
  individualWithStatusInfo: {
    statusType: String, // auto-entrepreneur, micro-entreprise, etc.
    registrationNumber: String,
    registrationDate: Date,
    taxId: String,
  },
  
  // Pour personne physique sans statut
  individualWithoutStatusInfo: {
    // Pas d'informations supplémentaires requises
    notes: String,
  },
  
  // Informations bancaires (privées)
  bankInfo: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    iban: String,
    swift: String,
  },
  
  // Informations de contact (privées)
  privateContact: {
    phone: String,
    email: String,
    alternateEmail: String,
  },
  
  // Documents (privés)
  documents: [{
    type: String, // ID, registration_certificate, tax_certificate, etc.
    url: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false },
  }],
  
  // Statut de l'onboarding
  onboardingStatus: {
    type: String,
    enum: ['in_progress', 'completed', 'pending_approval', 'approved', 'rejected'],
    default: 'in_progress',
  },
  
  // Progression (pourcentage)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  // Étapes complétées
  completedSteps: [{
    step: String,
    completedAt: Date,
  }],
  
  // Rejet/Approbation
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  rejectionReason: String,
  approvalNotes: String,
}, {
  timestamps: true,
});

// Index pour recherche rapide (operator index déjà défini dans le schéma avec unique: true)
operatorOnboardingSchema.index({ user: 1 });
operatorOnboardingSchema.index({ onboardingStatus: 1 });

const OperatorOnboarding = mongoose.model('OperatorOnboarding', operatorOnboardingSchema);

export default OperatorOnboarding;

