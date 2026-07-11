/**
 * Lexique FR → EN / ES / AR pour titres & descriptions catalogue.
 * Couvre villes + termes tourisme courants (pas un moteur NMT).
 */
const pairs = [
  ['Marrakech', 'Marrakech', 'Marrakech', 'مراكش'],
  ['Casablanca', 'Casablanca', 'Casablanca', 'الدار البيضاء'],
  ['Fès', 'Fez', 'Fez', 'فاس'],
  ['Fes', 'Fez', 'Fez', 'فاس'],
  ['Rabat', 'Rabat', 'Rabat', 'الرباط'],
  ['Tanger', 'Tangier', 'Tánger', 'طنجة'],
  ['Agadir', 'Agadir', 'Agadir', 'أكادير'],
  ['Meknès', 'Meknes', 'Meknes', 'مكناس'],
  ['Ouarzazate', 'Ouarzazate', 'Ouarzazate', 'ورزازات'],
  ['Essaouira', 'Essaouira', 'Essaouira', 'الصويرة'],
  ['Chefchaouen', 'Chefchaouen', 'Chefchaouen', 'شفشاون'],
  ['Merzouga', 'Merzouga', 'Merzouga', 'مرزوكة'],
  ['Visite guidée', 'Guided tour', 'Visita guiada', 'جولة مرشدة'],
  ['Visite', 'Tour', 'Visita', 'زيارة'],
  ['Excursion', 'Day trip', 'Excursión', 'رحلة يومية'],
  ['Circuit', 'Circuit', 'Circuito', 'مسار'],
  ['Balade', 'Walk', 'Paseo', 'نزهة'],
  ['Désert', 'Desert', 'Desierto', 'صحراء'],
  ['Médina', 'Medina', 'Medina', 'المدينة'],
  ['Souk', 'Souk', 'Zoco', 'سوق'],
  ['Plage', 'Beach', 'Playa', 'شاطئ'],
  ['Montagne', 'Mountain', 'Montaña', 'جبل'],
  ['Atlas', 'Atlas', 'Atlas', 'الأطلس'],
  ['Sahara', 'Sahara', 'Sáhara', 'الصحراء'],
  ['Quad', 'Quad', 'Quad', 'كواد'],
  ['Buggy', 'Buggy', 'Buggy', 'باغي'],
  ['Dromadaire', 'Camel', 'Dromedario', 'جمل'],
  ['Chameau', 'Camel', 'Camello', 'جمل'],
  ['Surf', 'Surf', 'Surf', 'ركوب الأمواج'],
  ['Yoga', 'Yoga', 'Yoga', 'يوغا'],
  ['Hammam', 'Hammam', 'Hammam', 'حمام'],
  ['Spa', 'Spa', 'Spa', 'سبا'],
  ['Riad', 'Riad', 'Riad', 'رياض'],
  ['Villa', 'Villa', 'Villa', 'فيلا'],
  ['Cuisine', 'Cuisine', 'Cocina', 'مطبخ'],
  ['Gastronomie', 'Gastronomy', 'Gastronomía', 'فن الطهي'],
  ['Atelier', 'Workshop', 'Taller', 'ورشة'],
  ['Cours', 'Class', 'Curso', 'دورة'],
  ['Privatisé', 'Private', 'Privado', 'خاص'],
  ['Privé', 'Private', 'Privado', 'خاص'],
  ['Famille', 'Family', 'Familia', 'عائلة'],
  ['Coucher de soleil', 'Sunset', 'Atardecer', 'غروب الشمس'],
  ['Lever de soleil', 'Sunrise', 'Amanecer', 'شروق الشمس'],
  ['Journée', 'Full day', 'Día completo', 'يوم كامل'],
  ['Demi-journée', 'Half day', 'Media jornada', 'نصف يوم'],
  ['heures', 'hours', 'horas', 'ساعات'],
  ['heure', 'hour', 'hora', 'ساعة'],
  ['Expérience', 'Experience', 'Experiencia', 'تجربة'],
  ['Authenticité', 'Authenticity', 'Autenticidad', 'أصالة'],
  ['Authentique', 'Authentic', 'Auténtico', 'أصيل'],
  ['Traditionnel', 'Traditional', 'Tradicional', 'تقليدي'],
  ['Découverte', 'Discovery', 'Descubrimiento', 'اكتشاف'],
  ['Aventure', 'Adventure', 'Aventura', 'مغامرة'],
  ['Nature', 'Nature', 'Naturaleza', 'طبيعة'],
  ['Culture', 'Culture', 'Cultura', 'ثقافة'],
  ['et', 'and', 'y', 'و'],
  ['avec', 'with', 'con', 'مع'],
  ['dans', 'in', 'en', 'في'],
  ['au', 'in', 'en', 'في'],
  ['à', 'in', 'en', 'في'],
  ['de', 'of', 'de', 'من'],
  ['du', 'of', 'del', 'من'],
  ['des', 'of', 'de', 'من'],
  ['le', 'the', 'el', 'ال'],
  ['la', 'the', 'la', 'ال'],
  ['les', 'the', 'los', 'ال'],
  ['un', 'a', 'un', ''],
  ['une', 'a', 'una', ''],
];

const applyLexicon = (text, langIndex) => {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  // Longer phrases first
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  for (const row of sorted) {
    const fr = row[0];
    const target = row[langIndex] || fr;
    if (!fr || fr === target) continue;
    const re = new RegExp(fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, target);
  }
  return out;
};

export const translateText = (text, lang) => {
  if (!text) return text;
  if (lang === 'fr') return text;
  const idx = { en: 1, es: 2, ar: 3 }[lang];
  if (!idx) return text;
  return applyLexicon(text, idx);
};

export const buildProductI18n = (product) => {
  const title = product.title || '';
  const description = product.description || '';
  const highlights = Array.isArray(product.highlights) ? product.highlights : [];
  const included = Array.isArray(product.included) ? product.included : [];

  const mapList = (list, lang) => list.map((item) => translateText(item, lang));

  return {
    fr: {
      title,
      description,
      highlights,
      included,
    },
    en: {
      title: translateText(title, 'en'),
      description: translateText(description, 'en'),
      highlights: mapList(highlights, 'en'),
      included: mapList(included, 'en'),
    },
    es: {
      title: translateText(title, 'es'),
      description: translateText(description, 'es'),
      highlights: mapList(highlights, 'es'),
      included: mapList(included, 'es'),
    },
    ar: {
      title: translateText(title, 'ar'),
      description: translateText(description, 'ar'),
      highlights: mapList(highlights, 'ar'),
      included: mapList(included, 'ar'),
    },
  };
};

export default { translateText, buildProductI18n };
