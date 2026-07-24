import mongoose from 'mongoose';

const operatorSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  
  // Étape 1: Type de prestataire
  providerType: {
    type: String,
    enum: ['company', 'individual_with_status', 'individual_without_status'],
    default: null,
  },
  
  // Étape 2: Informations publiques
  publicName: {
    type: String, // Nom public pour la promotion
  },
  description: {
    type: String, // Description des expériences offertes
  },
  location: {
    city: { type: String },
    address: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'Maroc' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  photos: {
    logo: { type: String }, // URL du logo
    gallery: [{ type: String }], // URLs des photos
  },
  
  // Étape 3: Adresse de la société
  companyAddress: {
    street: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'Maroc' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  
  // Étape 4: Expériences
  experiences: {
    type: String, // Description détaillée des expériences
  },

  /** Spécialités taxonomie (feuilles) — onboarding Viator-like */
  specialties: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    default: [],
  },

  /** Langues proposées (codes ISO : fr, en, es, ar, …) */
  languages: {
    type: [String],
    default: [],
  },
  
  // Étape 5: Informations privées (selon le type)
  // Pour personne morale (company)
  companyInfo: {
    companyName: { type: String }, // Nom de la société
    registrationNumber: { type: String }, // RC (Registre du Commerce)
    kbis: { type: String }, // legacy
    siret: { type: String }, // legacy FR
    vatNumber: { type: String },
    legalForm: { type: String }, // SARL, SARL AU, SA…
    capital: { type: Number },
    headquarters: { type: String },
    ice: { type: String }, // Identifiant Commun de l'Entreprise (15)
    rcCity: { type: String },
    ifNumber: { type: String }, // Identifiant fiscal
    taxId: { type: String }, // Taxe professionnelle / patente
  },
  
  // Pour personne physique avec statut
  individualWithStatusInfo: {
    firstName: { type: String },
    lastName: { type: String },
    status: { type: String }, // Auto-entrepreneur, etc.
    siret: { type: String }, // legacy
    apeCode: { type: String },
    taxStatus: { type: String },
    ice: { type: String },
    cnieNumber: { type: String },
    ifNumber: { type: String },
    taxId: { type: String },
  },
  
  // Pour personne physique sans statut
  individualWithoutStatusInfo: {
    firstName: { type: String },
    lastName: { type: String },
    idNumber: { type: String },
    cnieNumber: { type: String },
  },

  /** Secteurs d'activité réglementés (matrice compliance) */
  activitySectors: {
    type: [String],
    default: [],
  },

  /** Identité légale / champs sectoriels (CIN, agréments, etc.) */
  legalIdentity: {
    ice: { type: String, trim: true },
    rcNumber: { type: String, trim: true },
    rcCity: { type: String, trim: true },
    ifNumber: { type: String, trim: true },
    taxId: { type: String, trim: true },
    cnieNumber: { type: String, trim: true },
    drivingLicenseNumber: { type: String, trim: true },
    confidencePermitNumber: { type: String, trim: true },
    agreementNumber: { type: String, trim: true },
    transportAgreementNumber: { type: String, trim: true },
    rentalAgreementNumber: { type: String, trim: true },
    exploitationAuthNumber: { type: String, trim: true },
    classificationCategory: { type: String, trim: true },
    propertyAddress: { type: String, trim: true },
    guideLicenseNumber: { type: String, trim: true },
    guideLanguages: { type: String, trim: true },
    agencyLicenseNumber: { type: String, trim: true },
    agencyLicenseType: { type: String, trim: true },
    vehiclePlate: { type: String, trim: true },
    taxiCategory: { type: String, trim: true },
  },

  complianceDocuments: [{
    type: { type: String, required: true },
    fileUrl: { type: String },
    number: { type: String },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['missing', 'uploaded', 'in_review', 'verified', 'rejected'],
      default: 'missing',
    },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  complianceStatus: {
    type: String,
    enum: ['draft', 'submitted', 'in_review', 'needs_changes', 'verified'],
    default: 'draft',
  },
  
  // Statut et workflow
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'],
    default: 'Pending',
  },
  rejectionReason: {
    type: String,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  approvedAt: {
    type: Date,
  },
  
  // Indicateur de complétion du formulaire
  isFormCompleted: {
    type: Boolean,
    default: false,
  },
  completedSteps: {
    type: [String], // ['providerType', 'publicInfo', 'photos', 'address', 'experiences', 'privateInfo']
    default: [],
  },
  
  // Ancien champ pour compatibilité (deprecated)
  companyName: {
    type: String,
  },

  /** Contact téléphone (édition admin / affichage interne) */
  phone: {
    type: String,
    trim: true,
  },

  /** Email / réseaux publics contact métier */
  contactEmail: { type: String, trim: true },
  website: { type: String, trim: true },
  socialLinks: {
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
  },

  /** Coordonnées bancaires pour retraits (persistées) */
  banking: {
    accountHolder: { type: String, trim: true },
    bankName: { type: String, trim: true },
    iban: { type: String, trim: true },
    rib: { type: String, trim: true },
    paypalEmail: { type: String, trim: true },
  },

  /** Notes internes direction (jamais exposées publiquement) */
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  
  // Validation automatique des produits pour cet opérateur
  autoApproveProducts: {
    type: Boolean,
    default: false,
  },
  isClaimed: {
    type: Boolean,
    default: true,
  },

  // Tags/segments d'authenticité opérateur
  authenticity: {
    isArtisan: { type: Boolean, default: false },
    isAuthenticLocal: { type: Boolean, default: false },
    isEcoFriendly: { type: Boolean, default: false },
    isTraditional: { type: Boolean, default: false },
    isLocal100: { type: Boolean, default: false },
  },
  
  // Badges et certifications
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Système de points
  points: {
    type: Number,
    default: 0,
  },
  
  // Métriques pour badges
  metrics: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    responseTime: { type: Number, default: null }, // Average response time in hours
    completionRate: { type: Number, default: 100 }, // Percentage of completed bookings
    isVerified: { type: Boolean, default: false },
    isLocal: { type: Boolean, default: true }, // Moroccan operator
  },
}, {
  timestamps: true,
});

// Sprint [8]: one operator profile per user + admin status filtering
operatorSchema.index({ user: 1 }, { unique: true });
operatorSchema.index({ status: 1, createdAt: -1 });

const Operator = mongoose.model('Operator', operatorSchema);

export default Operator;
