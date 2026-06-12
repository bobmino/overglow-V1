const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'frontend', 'public', 'locales');
const langs = ['fr', 'en', 'ar', 'es'];

const newKeys = {
  footer: {
    faq: { fr: "FAQ", en: "FAQ", ar: "الأسئلة الشائعة", es: "FAQ" },
    safety: { fr: "Sécurité", en: "Safety", ar: "الأمان", es: "Seguridad" },
    careers: { fr: "Carrières", en: "Careers", ar: "الوظائف", es: "Carreras" },
    press: { fr: "Presse", en: "Press", ar: "الصحافة", es: "Prensa" },
    operator_help: { fr: "Centre d'aide opérateur", en: "Operator Help Center", ar: "مركز مساعدة المشغلين", es: "Centro de ayuda para operadores" },
    operator_resources: { fr: "Ressources", en: "Resources", ar: "الموارد", es: "Recursos" },
    operator_community: { fr: "Communauté", en: "Community", ar: "المجتمع", es: "Comunidad" },
    cookies: { fr: "Cookies", en: "Cookies", ar: "ملفات تعريف الارتباط", es: "Cookies" },
    accessibility: { fr: "Accessibilité", en: "Accessibility", ar: "إمكانية الوصول", es: "Accesibilidad" },
    how_it_works: { fr: "Comment ça marche", en: "How it works", ar: "كيف يعمل", es: "Cómo funciona" },
    cookie_consent: { fr: "Préférences de cookies", en: "Cookie Preferences", ar: "تفضيلات ملفات تعريف الارتباط", es: "Preferencias de cookies" },
    about: { fr: "Qui sommes-nous", en: "About Us", ar: "معلومات عنا", es: "Sobre nosotros" },
    discover_morocco: { fr: "Découvrir le Maroc", en: "Discover Morocco", ar: "اكتشف المغرب", es: "Descubre Marruecos" },
    blog: { fr: "Blog", en: "Blog", ar: "مدونة", es: "Blog" },
    become_partner: { fr: "Devenir partenaire", en: "Become a partner", ar: "كن شريكاً", es: "Conviértete en socio" },
    terms: { fr: "Conditions d'utilisation", en: "Terms of Service", ar: "شروط الاستخدام", es: "Términos de servicio" },
    privacy: { fr: "Confidentialité", en: "Privacy", ar: "الخصوصية", es: "Privacidad" },
    help_center: { fr: "Centre d'aide", en: "Help Center", ar: "مركز المساعدة", es: "Centro de ayuda" },
    contact_us: { fr: "Nous contacter", en: "Contact Us", ar: "اتصل بنا", es: "Contáctenos" }
  },
  mega_menu: {
    surf_plage: { fr: "Surf & Plage", en: "Surf & Beach", ar: "ركوب الأمواج والشاطئ", es: "Surf y Playa" },
    aventure_nature: { fr: "Aventure & Nature", en: "Adventure & Nature", ar: "المغامرة والطبيعة", es: "Aventura y Naturaleza" },
    visites_guidees: { fr: "Visites Guidées", en: "Guided Tours", ar: "جولات سياحية", es: "Visitas Guiadas" },
    gastronomie: { fr: "Gastronomie", en: "Gastronomy", ar: "فن الطهي", es: "Gastronomía" },
    culture_medina: { fr: "Culture & Médina", en: "Culture & Medina", ar: "الثقافة والمدينة", es: "Cultura y Medina" },
    detente_bien_etre: { fr: "Détente & Bien-être", en: "Relaxation & Wellness", ar: "الاسترخاء والعافية", es: "Relajación y Bienestar" },
    villas_prestige: { fr: "Villas de Prestige", en: "Luxury Villas", ar: "فيلات فاخرة", es: "Villas de Lujo" },
    apparts_vue_ocean: { fr: "Appartements Vue Océan", en: "Ocean View Apartments", ar: "شقق مطلة على المحيط", es: "Apartamentos con Vista al Océano" },
    riads_insolites: { fr: "Riads Insolites", en: "Unique Riads", ar: "رياض فريدة", es: "Riads Únicos" },
    mobilite_chauffeurs: { fr: "Mobilité & Chauffeurs", en: "Mobility & Drivers", ar: "التنقل والسائقين", es: "Movilidad y Conductores" },
    services_carte: { fr: "Services À la Carte", en: "A la Carte Services", ar: "خدمات حسب الطلب", es: "Servicios a la Carta" }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesPath, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.footer) data.footer = {};
    if (!data.mega_menu) data.mega_menu = {};

    for (const [key, translations] of Object.entries(newKeys.footer)) {
      data.footer[key] = translations[lang] || translations['en'];
    }
    
    for (const [key, translations] of Object.entries(newKeys.mega_menu)) {
      data.mega_menu[key] = translations[lang] || translations['en'];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}/translation.json`);
  }
});
