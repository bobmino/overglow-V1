const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'frontend', 'public', 'locales');

const patch = {
  fr: {
    adminNav: {
      section_ops: 'Opérations',
      section_catalogue: 'Contenu',
      section_moderation: 'Confiance',
      section_finance: 'Finance',
      section_people: 'Personnes',
      section_config: 'Configuration',
      dashboard: 'Tableau de bord',
      bookings: 'Réservations',
      messages: 'Messages',
      analytics: 'Statistiques',
      products: 'Produits',
      blog: 'Blog',
      faq: 'FAQ',
      badges: 'Badges',
      reviews: 'Avis',
      operator_requests: 'Demandes opérateurs',
      badge_requests: 'Demandes badges',
      finance: 'Finances',
      pending_payments: 'Paiements en attente',
      withdrawals: 'Retraits',
      users: 'Utilisateurs',
      operators: 'Opérateurs',
      settings: 'Paramètres',
      operator_section_main: 'Activité',
      operator_section_account: 'Compte & aide',
      operator_dashboard: 'Mon tableau de bord',
      operator_products: 'Mes produits',
      operator_bookings: 'Mes réservations',
      operator_messages: 'Messages',
      operator_analytics: 'Mes statistiques',
      operator_revenue: 'Mes revenus',
      operator_profile: 'Mon profil',
      operator_help: 'Aide opérateur',
      operator_resources: 'Ressources',
      brand_admin: 'Overglow Admin',
      brand_operator: 'Overglow Opérateur',
      aria_admin: 'Navigation admin',
      aria_operator: 'Navigation opérateur',
      close_menu: 'Fermer le menu',
      expand: 'Développer le menu',
      collapse: 'Réduire le menu',
    },
    adminFaq: {
      title: 'FAQ',
      subtitle: 'Questions gérées en base — visibles sur /faq et le centre d’aide.',
      seed_button: 'Initialiser FAQ (4 langues)',
      seed_confirm: 'Importer les FAQ par défaut (sans doublons) ?',
      seed_success: '{{created}} créées, {{skipped}} déjà présentes',
      seed_error: 'Échec de l’initialisation FAQ',
      load_error: 'Impossible de charger les FAQ',
      empty: 'Aucune FAQ en base',
      empty_hint: 'Cliquez sur « Initialiser FAQ » pour publier le contenu de démarrage.',
      filter_all: 'Toutes',
      inactive: 'Inactive',
      delete_confirm: 'Supprimer cette FAQ ?',
      delete_success: 'FAQ supprimée',
      delete_error: 'Échec de la suppression',
    },
    adminBlogExtra: {
      seed_button: 'Initialiser articles SEO',
      seed_success: '{{created}} articles créés, {{skipped}} déjà présents',
      seed_error: 'Échec du seed blog',
    },
    safety: {
      title: 'Sécurité voyage',
      subtitle: 'Conseils pratiques pour voyager sereinement au Maroc avec Overglow Trip.',
      meta: 'Sécurité voyage au Maroc : conseils, urgences, assurance et support Overglow.',
      tips_title: 'Conseils de voyage',
      tips: [
        'Gardez une copie numérique de vos documents (passeport, billets).',
        'Privilégiez les transports et activités réservés via la plateforme.',
        'Respectez les consignes locales et les horaires de vos expériences.',
        'Partagez votre itinéraire avec un proche et restez joignable.',
        'Hydratez-vous, surtout en été et lors d’activités outdoor.',
      ],
      emergency_title: 'Numéros d’urgence (Maroc)',
      emergencies: [
        'Police: 19 ou 190',
        'Pompiers: 15',
        'SAMU / urgences médicales: 15',
        'Gendarmerie: 177',
        'Assistance routière: 5050',
      ],
      emergency_note: 'Depuis un mobile étranger, composez +212 si nécessaire.',
      insurance_title: 'Assurance',
      insurance_body:
        'Nous recommandons une assurance voyage couvrant santé, rapatriement et annulation. Vérifiez que vos activités sont incluses.',
      insurance_cancel:
        'En cas d’annulation selon la politique du produit, le remboursement suit les conditions affichées au checkout.',
      support_title: 'Support Overglow',
      support_body: 'Pour une réservation en cours, contactez-nous via le centre d’aide avec votre numéro de dossier.',
      support_cta: 'Centre d’aide',
    },
    careers: {
      title: 'Carrières',
      subtitle: 'Rejoignez Overglow Trip pour un tourisme marocain plus authentique.',
      meta: 'Carrières Overglow Trip — candidatures spontanées.',
      mission_title: 'Notre mission',
      mission_body:
        'Nous connectons voyageurs et opérateurs locaux pour des expériences vérifiées, équitables et mémorables.',
      openings_title: 'Postes ouverts',
      openings_body:
        'Aucune offre publiée pour le moment. Envoyez une candidature spontanée — nous vous recontactons si un besoin correspond.',
      email_subject: 'Candidature spontanée — Overglow Trip',
      apply_cta: 'Envoyer une candidature',
      culture_title: 'Culture',
      culture_items: [
        'Autonomie et ownership sur les livrables.',
        'Respect des opérateurs locaux et de l’authenticité.',
        'Feedback direct, focus qualité produit.',
      ],
    },
    press: {
      title: 'Presse',
      subtitle: 'Ressources médias et contact presse.',
      meta: 'Kit presse Overglow Trip et contact média.',
      kit_title: 'Kit presse',
      kit_body: 'Fact sheet, captures produit et éléments de langage sur demande.',
      kit_email_subject: 'Demande kit presse',
      kit_cta: 'Demander le kit presse',
      logo_title: 'Logos',
      logo_body: 'Logo principal. Usage presse non commercial avec crédit « Overglow Trip ».',
      logo_cta: 'Télécharger le logo (SVG)',
      mentions_title: 'Mentions médias',
      mentions_body:
        'Nous n’affichons que des mentions vérifiées. Contactez press@overglowtrip.com pour un dossier actualisé.',
      contact_title: 'Contact média',
      contact_body: 'Interviews, partenariats éditoriaux et demandes d’images :',
    },
  },
  en: {
    adminNav: {
      section_ops: 'Operations',
      section_catalogue: 'Content',
      section_moderation: 'Trust',
      section_finance: 'Finance',
      section_people: 'People',
      section_config: 'Settings',
      dashboard: 'Dashboard',
      bookings: 'Bookings',
      messages: 'Messages',
      analytics: 'Analytics',
      products: 'Products',
      blog: 'Blog',
      faq: 'FAQ',
      badges: 'Badges',
      reviews: 'Reviews',
      operator_requests: 'Operator requests',
      badge_requests: 'Badge requests',
      finance: 'Finance',
      pending_payments: 'Pending payments',
      withdrawals: 'Withdrawals',
      users: 'Users',
      operators: 'Operators',
      settings: 'Settings',
      operator_section_main: 'Activity',
      operator_section_account: 'Account & help',
      operator_dashboard: 'My dashboard',
      operator_products: 'My products',
      operator_bookings: 'My bookings',
      operator_messages: 'Messages',
      operator_analytics: 'My analytics',
      operator_revenue: 'My payouts',
      operator_profile: 'My profile',
      operator_help: 'Operator help',
      operator_resources: 'Resources',
      brand_admin: 'Overglow Admin',
      brand_operator: 'Overglow Operator',
      aria_admin: 'Admin navigation',
      aria_operator: 'Operator navigation',
      close_menu: 'Close menu',
      expand: 'Expand menu',
      collapse: 'Collapse menu',
    },
    adminFaq: {
      title: 'FAQ',
      subtitle: 'Database-managed questions shown on /faq and Help.',
      seed_button: 'Initialize FAQ (4 languages)',
      seed_confirm: 'Import default FAQs (skip duplicates)?',
      seed_success: '{{created}} created, {{skipped}} already present',
      seed_error: 'FAQ initialization failed',
      load_error: 'Could not load FAQs',
      empty: 'No FAQs in database',
      empty_hint: 'Click Initialize FAQ to publish starter content.',
      filter_all: 'All',
      inactive: 'Inactive',
      delete_confirm: 'Delete this FAQ?',
      delete_success: 'FAQ deleted',
      delete_error: 'Delete failed',
    },
    adminBlogExtra: {
      seed_button: 'Initialize SEO articles',
      seed_success: '{{created}} created, {{skipped}} already present',
      seed_error: 'Blog seed failed',
    },
    safety: {
      title: 'Travel safety',
      subtitle: 'Practical tips for travelling in Morocco with Overglow Trip.',
      meta: 'Morocco travel safety: tips, emergencies, insurance and Overglow support.',
      tips_title: 'Travel tips',
      tips: [
        'Keep digital copies of documents (passport, tickets).',
        'Prefer transfers and activities booked on the platform.',
        'Follow local guidelines and experience schedules.',
        'Share your itinerary with someone and stay reachable.',
        'Stay hydrated, especially in summer and outdoor activities.',
      ],
      emergency_title: 'Emergency numbers (Morocco)',
      emergencies: [
        'Police: 19 or 190',
        'Fire: 15',
        'Medical / SAMU: 15',
        'Gendarmerie: 177',
        'Roadside assistance: 5050',
      ],
      emergency_note: 'From a foreign mobile, dial +212 if needed.',
      insurance_title: 'Insurance',
      insurance_body:
        'We recommend travel insurance covering health, repatriation and cancellation. Check your activities are included.',
      insurance_cancel:
        'If you cancel under the product policy, refunds follow the terms shown at checkout.',
      support_title: 'Overglow support',
      support_body: 'For an active booking, contact Help with your booking reference.',
      support_cta: 'Help centre',
    },
    careers: {
      title: 'Careers',
      subtitle: 'Join Overglow Trip for more authentic Moroccan tourism.',
      meta: 'Overglow Trip careers — spontaneous applications.',
      mission_title: 'Our mission',
      mission_body:
        'We connect travellers and local operators for verified, fair and memorable experiences.',
      openings_title: 'Open roles',
      openings_body:
        'No published openings right now. Send a spontaneous application — we will reply if there is a match.',
      email_subject: 'Spontaneous application — Overglow Trip',
      apply_cta: 'Send application',
      culture_title: 'Culture',
      culture_items: [
        'Ownership of deliverables.',
        'Respect for local operators and authenticity.',
        'Direct feedback, product quality focus.',
      ],
    },
    press: {
      title: 'Press',
      subtitle: 'Media resources and press contact.',
      meta: 'Overglow Trip press kit and media contact.',
      kit_title: 'Press kit',
      kit_body: 'Fact sheet, product screenshots and messaging on request.',
      kit_email_subject: 'Press kit request',
      kit_cta: 'Request press kit',
      logo_title: 'Logos',
      logo_body: 'Primary logo. Non-commercial press use with credit “Overglow Trip”.',
      logo_cta: 'Download logo (SVG)',
      mentions_title: 'Media coverage',
      mentions_body:
        'We only list verified coverage. Contact press@overglowtrip.com for an updated pack.',
      contact_title: 'Media contact',
      contact_body: 'Interviews, editorial partnerships and image requests:',
    },
  },
};

// ES/AR lighter mirrors for admin + safety/careers/press
patch.es = JSON.parse(JSON.stringify(patch.en));
patch.ar = JSON.parse(JSON.stringify(patch.en));
Object.assign(patch.es.adminNav, {
  section_ops: 'Operaciones',
  section_catalogue: 'Contenido',
  section_moderation: 'Confianza',
  section_finance: 'Finanzas',
  section_people: 'Personas',
  section_config: 'Configuración',
  dashboard: 'Panel',
  bookings: 'Reservas',
  messages: 'Mensajes',
  analytics: 'Estadísticas',
  products: 'Productos',
  faq: 'FAQ',
  reviews: 'Opiniones',
  settings: 'Ajustes',
});
Object.assign(patch.es.safety, {
  title: 'Seguridad de viaje',
  subtitle: 'Consejos prácticos para viajar a Marruecos con Overglow Trip.',
  meta: 'Seguridad en Marruecos: consejos, emergencias, seguro y soporte.',
});
Object.assign(patch.es.careers, {
  title: 'Carreras',
  openings_body:
    'No hay vacantes publicadas. Envía una candidatura espontánea.',
  apply_cta: 'Enviar candidatura',
});
Object.assign(patch.es.press, {
  title: 'Prensa',
  mentions_body:
    'Solo mostramos menciones verificadas. Contacta press@overglowtrip.com.',
});
Object.assign(patch.ar.adminNav, {
  section_ops: 'العمليات',
  section_catalogue: 'المحتوى',
  section_moderation: 'الثقة',
  section_finance: 'المالية',
  section_people: 'الأشخاص',
  section_config: 'الإعدادات',
  dashboard: 'لوحة التحكم',
  bookings: 'الحجوزات',
  messages: 'الرسائل',
  analytics: 'الإحصاءات',
  products: 'المنتجات',
  faq: 'الأسئلة الشائعة',
  reviews: 'التقييمات',
  settings: 'الإعدادات',
});
Object.assign(patch.ar.safety, {
  title: 'سلامة السفر',
  subtitle: 'نصائح عملية للسفر في المغرب مع Overglow Trip.',
  meta: 'سلامة السفر في المغرب: نصائح وطوارئ ودعم.',
});
Object.assign(patch.ar.careers, {
  title: 'الوظائف',
  openings_body: 'لا توجد وظائف منشورة حالياً. أرسل طلباً تلقائياً.',
  apply_cta: 'إرسال طلب',
});
Object.assign(patch.ar.press, {
  title: 'الصحافة',
  mentions_body: 'نعرض فقط التغطيات الموثّقة. تواصل مع press@overglowtrip.com.',
});

for (const lang of ['fr', 'en', 'es', 'ar']) {
  const file = path.join(dir, lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const p = patch[lang];
  data.admin = data.admin || {};
  data.admin.nav = { ...(data.admin.nav || {}), ...p.adminNav };
  data.admin.faq = { ...(data.admin.faq || {}), ...p.adminFaq };
  data.admin.blog = { ...(data.admin.blog || {}), ...p.adminBlogExtra };
  data.safety = { ...(data.safety || {}), ...p.safety };
  data.careers = { ...(data.careers || {}), ...p.careers };
  data.press = { ...(data.press || {}), ...p.press };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log('ok', lang);
}
