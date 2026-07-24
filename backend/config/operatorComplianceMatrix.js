/**
 * Matrice KYC/KYB fournisseurs Maroc — soft-launch Overglow.
 * Collecte + revue admin manuelle (pas d'API CIN/OMPIC automatique).
 */

export const ACTIVITY_SECTORS = [
  {
    id: 'activity_provider',
    store: 'explore',
    labelKey: 'compliance.sector_activity',
    labelFr: 'Activités & expériences',
  },
  {
    id: 'licensed_guide',
    store: 'explore',
    labelKey: 'compliance.sector_guide',
    labelFr: 'Guide touristique agréé',
  },
  {
    id: 'travel_agency',
    store: 'explore',
    labelKey: 'compliance.sector_agency',
    labelFr: 'Agence de voyages / organisateur',
  },
  {
    id: 'classified_stay',
    store: 'stays',
    labelKey: 'compliance.sector_stay',
    labelFr: 'Hébergement touristique',
  },
  {
    id: 'taxi_operator',
    store: 'extras',
    labelKey: 'compliance.sector_taxi',
    labelFr: 'Taxi (petit / grand)',
  },
  {
    id: 'tourist_transport',
    store: 'extras',
    labelKey: 'compliance.sector_tourist_transport',
    labelFr: 'Transport touristique / transferts',
  },
  {
    id: 'car_rental',
    store: 'extras',
    labelKey: 'compliance.sector_car_rental',
    labelFr: 'Location de véhicules',
  },
  {
    id: 'private_driver',
    store: 'extras',
    labelKey: 'compliance.sector_private_driver',
    labelFr: 'Chauffeur privé',
  },
  {
    id: 'photographer',
    store: 'extras',
    labelKey: 'compliance.sector_photographer',
    labelFr: 'Photographie',
  },
  {
    id: 'concierge',
    store: 'extras',
    labelKey: 'compliance.sector_concierge',
    labelFr: 'Conciergerie / services premium',
  },
];

const BASE_COMPANY_FIELDS = [
  { id: 'companyName', labelKey: 'compliance.field_company_name', required: true },
  { id: 'legalForm', labelKey: 'compliance.field_legal_form', required: true },
  { id: 'ice', labelKey: 'compliance.field_ice', required: true },
  { id: 'rcNumber', labelKey: 'compliance.field_rc', required: true },
  { id: 'rcCity', labelKey: 'compliance.field_rc_city', required: true },
  { id: 'ifNumber', labelKey: 'compliance.field_if', required: false },
  { id: 'taxId', labelKey: 'compliance.field_tp', required: false },
];

const BASE_INDIVIDUAL_FIELDS = [
  { id: 'firstName', labelKey: 'compliance.field_first_name', required: true },
  { id: 'lastName', labelKey: 'compliance.field_last_name', required: true },
  { id: 'cnieNumber', labelKey: 'compliance.field_cnie', required: true },
];

const BASE_AE_FIELDS = [
  ...BASE_INDIVIDUAL_FIELDS,
  { id: 'ice', labelKey: 'compliance.field_ice', required: true },
  { id: 'taxId', labelKey: 'compliance.field_tp', required: false },
  { id: 'ifNumber', labelKey: 'compliance.field_if', required: false },
];

const BASE_DOCS = {
  company: [
    { type: 'rc_extract', labelKey: 'compliance.doc_rc_extract', requiredForReview: true, expires: false },
    { type: 'ice_attestation', labelKey: 'compliance.doc_ice', requiredForReview: true, expires: false },
    { type: 'manager_cnie', labelKey: 'compliance.doc_manager_cnie', requiredForReview: true, expires: true },
  ],
  auto_entrepreneur: [
    { type: 'ae_attestation', labelKey: 'compliance.doc_ae', requiredForReview: true, expires: false },
    { type: 'cnie_copy', labelKey: 'compliance.doc_cnie', requiredForReview: true, expires: true },
  ],
  individual: [
    { type: 'cnie_copy', labelKey: 'compliance.doc_cnie', requiredForReview: true, expires: true },
  ],
};

/** Documents / champs sectoriels (Maroc). */
export const SECTOR_REQUIREMENTS = {
  taxi_operator: {
    riskLevel: 'high',
    fields: [
      { id: 'cnieNumber', labelKey: 'compliance.field_cnie', required: true },
      { id: 'drivingLicenseNumber', labelKey: 'compliance.field_driving_license', required: true },
      { id: 'confidencePermitNumber', labelKey: 'compliance.field_confidence_permit', required: true },
      { id: 'agreementNumber', labelKey: 'compliance.field_taxi_agreement', required: true },
      { id: 'vehiclePlate', labelKey: 'compliance.field_vehicle_plate', required: true },
      { id: 'taxiCategory', labelKey: 'compliance.field_taxi_category', required: true },
    ],
    documents: [
      { type: 'cnie_copy', labelKey: 'compliance.doc_cnie', requiredForReview: true, expires: true },
      { type: 'driving_license', labelKey: 'compliance.doc_driving_license', requiredForReview: true, expires: true },
      { type: 'confidence_permit', labelKey: 'compliance.doc_confidence_permit', requiredForReview: true, expires: true },
      { type: 'taxi_exploitation_contract', labelKey: 'compliance.doc_taxi_contract', requiredForReview: true, expires: false },
      { type: 'vehicle_registration', labelKey: 'compliance.doc_carte_grise', requiredForReview: true, expires: false },
      { type: 'vehicle_insurance', labelKey: 'compliance.doc_insurance', requiredForReview: true, expires: true },
    ],
  },
  tourist_transport: {
    riskLevel: 'high',
    fields: [
      { id: 'transportAgreementNumber', labelKey: 'compliance.field_transport_agreement', required: true },
      { id: 'ice', labelKey: 'compliance.field_ice', required: true },
      { id: 'rcNumber', labelKey: 'compliance.field_rc', required: true },
    ],
    documents: [
      { type: 'transport_agreement', labelKey: 'compliance.doc_transport_agreement', requiredForReview: true, expires: true },
      { type: 'vehicle_special_auth', labelKey: 'compliance.doc_vehicle_auth', requiredForReview: true, expires: true },
      { type: 'rc_extract', labelKey: 'compliance.doc_rc_extract', requiredForReview: true, expires: false },
      { type: 'fleet_insurance', labelKey: 'compliance.doc_fleet_insurance', requiredForReview: true, expires: true },
    ],
  },
  car_rental: {
    riskLevel: 'high',
    fields: [
      { id: 'ice', labelKey: 'compliance.field_ice', required: true },
      { id: 'rcNumber', labelKey: 'compliance.field_rc', required: true },
      { id: 'rentalAgreementNumber', labelKey: 'compliance.field_rental_agreement', required: true },
    ],
    documents: [
      { type: 'rc_extract', labelKey: 'compliance.doc_rc_extract', requiredForReview: true, expires: false },
      { type: 'ice_attestation', labelKey: 'compliance.doc_ice', requiredForReview: true, expires: false },
      { type: 'rental_authorization', labelKey: 'compliance.doc_rental_auth', requiredForReview: true, expires: true },
      { type: 'fleet_insurance', labelKey: 'compliance.doc_fleet_insurance', requiredForReview: true, expires: true },
    ],
  },
  classified_stay: {
    riskLevel: 'high',
    fields: [
      { id: 'propertyAddress', labelKey: 'compliance.field_property_address', required: true },
      { id: 'exploitationAuthNumber', labelKey: 'compliance.field_exploitation_auth', required: true },
      { id: 'classificationCategory', labelKey: 'compliance.field_classification', required: false },
    ],
    documents: [
      { type: 'exploitation_authorization', labelKey: 'compliance.doc_exploitation_auth', requiredForReview: true, expires: true },
      { type: 'classification_certificate', labelKey: 'compliance.doc_classification', requiredForReview: false, expires: true },
      { type: 'property_title_or_lease', labelKey: 'compliance.doc_property_title', requiredForReview: true, expires: false },
      { type: 'property_insurance', labelKey: 'compliance.doc_insurance', requiredForReview: true, expires: true },
    ],
  },
  licensed_guide: {
    riskLevel: 'medium',
    fields: [
      { id: 'cnieNumber', labelKey: 'compliance.field_cnie', required: true },
      { id: 'guideLicenseNumber', labelKey: 'compliance.field_guide_license', required: true },
      { id: 'guideLanguages', labelKey: 'compliance.field_guide_languages', required: false },
    ],
    documents: [
      { type: 'cnie_copy', labelKey: 'compliance.doc_cnie', requiredForReview: true, expires: true },
      { type: 'guide_license', labelKey: 'compliance.doc_guide_license', requiredForReview: true, expires: true },
      { type: 'rc_pro_insurance', labelKey: 'compliance.doc_rc_pro', requiredForReview: false, expires: true },
    ],
  },
  travel_agency: {
    riskLevel: 'high',
    fields: [
      { id: 'ice', labelKey: 'compliance.field_ice', required: true },
      { id: 'rcNumber', labelKey: 'compliance.field_rc', required: true },
      { id: 'agencyLicenseNumber', labelKey: 'compliance.field_agency_license', required: true },
      { id: 'agencyLicenseType', labelKey: 'compliance.field_agency_type', required: true },
    ],
    documents: [
      { type: 'agency_license', labelKey: 'compliance.doc_agency_license', requiredForReview: true, expires: true },
      { type: 'rc_extract', labelKey: 'compliance.doc_rc_extract', requiredForReview: true, expires: false },
      { type: 'rc_pro_insurance', labelKey: 'compliance.doc_rc_pro', requiredForReview: true, expires: true },
    ],
  },
  activity_provider: {
    riskLevel: 'medium',
    fields: [],
    documents: [
      { type: 'rc_pro_insurance', labelKey: 'compliance.doc_rc_pro', requiredForReview: false, expires: true },
    ],
  },
  private_driver: {
    riskLevel: 'high',
    fields: [
      { id: 'cnieNumber', labelKey: 'compliance.field_cnie', required: true },
      { id: 'drivingLicenseNumber', labelKey: 'compliance.field_driving_license', required: true },
    ],
    documents: [
      { type: 'cnie_copy', labelKey: 'compliance.doc_cnie', requiredForReview: true, expires: true },
      { type: 'driving_license', labelKey: 'compliance.doc_driving_license', requiredForReview: true, expires: true },
      { type: 'vehicle_insurance', labelKey: 'compliance.doc_insurance', requiredForReview: true, expires: true },
    ],
  },
  photographer: {
    riskLevel: 'low',
    fields: [],
    documents: [
      { type: 'portfolio_or_references', labelKey: 'compliance.doc_portfolio', requiredForReview: false, expires: false },
    ],
  },
  concierge: {
    riskLevel: 'low',
    fields: [],
    documents: [
      { type: 'rc_pro_insurance', labelKey: 'compliance.doc_rc_pro', requiredForReview: false, expires: true },
    ],
  },
};

/**
 * Mappe providerType wizard → forme pour la matrice.
 */
export const mapProviderTypeToLegalForm = (providerType) => {
  if (providerType === 'company') return 'company';
  if (providerType === 'individual_with_status') return 'auto_entrepreneur';
  return 'individual';
};

/**
 * Fusionne champs + documents base légale + secteurs sélectionnés.
 */
export const resolveRequirements = ({ legalForm, providerType, sectors = [] } = {}) => {
  const form = legalForm || mapProviderTypeToLegalForm(providerType);
  const sectorIds = [...new Set((sectors || []).filter(Boolean))];

  let fields = [];
  let documents = [];

  if (form === 'company') {
    fields = [...BASE_COMPANY_FIELDS];
    documents = [...BASE_DOCS.company];
  } else if (form === 'auto_entrepreneur' || form === 'sole_trader_rc') {
    fields = [...BASE_AE_FIELDS];
    documents = [...BASE_DOCS.auto_entrepreneur];
  } else {
    fields = [...BASE_INDIVIDUAL_FIELDS];
    documents = [...BASE_DOCS.individual];
  }

  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const docMap = new Map(documents.map((d) => [d.type, d]));
  let maxRisk = 'low';

  sectorIds.forEach((sectorId) => {
    const req = SECTOR_REQUIREMENTS[sectorId];
    if (!req) return;
    if (req.riskLevel === 'high') maxRisk = 'high';
    else if (req.riskLevel === 'medium' && maxRisk !== 'high') maxRisk = 'medium';

    (req.fields || []).forEach((f) => {
      const prev = fieldMap.get(f.id);
      if (!prev || (f.required && !prev.required)) fieldMap.set(f.id, f);
    });
    (req.documents || []).forEach((d) => {
      const prev = docMap.get(d.type);
      if (!prev || (d.requiredForReview && !prev.requiredForReview)) docMap.set(d.type, d);
    });
  });

  return {
    legalForm: form,
    sectors: sectorIds,
    riskLevel: maxRisk,
    fields: [...fieldMap.values()],
    documents: [...docMap.values()],
    sectorsMeta: ACTIVITY_SECTORS.filter((s) => sectorIds.includes(s.id)),
  };
};

export default {
  ACTIVITY_SECTORS,
  SECTOR_REQUIREMENTS,
  resolveRequirements,
  mapProviderTypeToLegalForm,
};
