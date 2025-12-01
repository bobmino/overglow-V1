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
    country: { type: String, default: 'France' },
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
    country: { type: String, default: 'France' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  
  // Étape 4: Expériences
  experiences: {
    type: String, // Description détaillée des expériences
  },
  
  // Étape 5: Informations privées (selon le type)
  // Pour personne morale (company)
  companyInfo: {
    companyName: { type: String }, // Nom de la société
    registrationNumber: { type: String }, // RC (Registre du Commerce)
    kbis: { type: String }, // Numéro KABIS
    siret: { type: String }, // Numéro SIRET
    vatNumber: { type: String }, // Numéro TVA
    legalForm: { type: String }, // Forme juridique (SARL, SAS, etc.)
    capital: { type: Number }, // Capital social
    headquarters: { type: String }, // Siège social
  },
  
  // Pour personne physique avec statut
  individualWithStatusInfo: {
    firstName: { type: String },
    lastName: { type: String },
    status: { type: String }, // Auto-entrepreneur, Micro-entreprise, etc.
    siret: { type: String },
    apeCode: { type: String }, // Code APE
    taxStatus: { type: String }, // Régime fiscal
  },
  
  // Pour personne physique sans statut
  individualWithoutStatusInfo: {
    firstName: { type: String },
    lastName: { type: String },
    idNumber: { type: String }, // Numéro de pièce d'identité
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
  
  // Validation automatique des produits pour cet opérateur
  autoApproveProducts: {
    type: Boolean,
    default: false,
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

const Operator = mongoose.model('Operator', operatorSchema);

export default Operator;
