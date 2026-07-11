/**
 * Contenu éditorial multilingue (About + Culture).
 * Source de vérité data-driven — pas de prose hardcodée dans le JSX.
 */

import { moroccanCultureData, authenticityTags as frAuthTags } from './moroccanCulture.js';
import { normalizeLang, DEFAULT_LANG } from '../utils/contentI18n.js';

/** Traductions par id d'item culture (title + description + content) */
const cultureTranslations = {
  'mint-tea': {
    en: {
      title: 'Mint Tea',
      description: 'More than a drink in Morocco — a social ritual of hospitality and togetherness.',
      content: 'Mint tea (atay) is prepared with Chinese gunpowder green tea, fresh mint and sugar. It is poured from high to create foam and served three times, each with its own meaning.',
    },
    ar: {
      title: 'الشاي بالنعناع',
      description: 'أكثر من مشروب في المغرب — طقس اجتماعي للضيافة والاجتماع.',
      content: 'يُحضَّر الشاي بالنعناع (أتاي) من الشاي الأخضر والنعناع الطازج والسكر، ويُسكب من علوّ لتكوين الرغوة ويُقدَّم ثلاث مرات.',
    },
    es: {
      title: 'Té a la menta',
      description: 'Más que una bebida en Marruecos: un ritual social de hospitalidad.',
      content: 'El té a la menta (atay) se prepara con té verde, menta fresca y azúcar. Se sirve tres veces, cada una con su significado.',
    },
  },
  hammam: {
    en: {
      title: 'Traditional Hammam',
      description: 'A steam bath for purification and social connection in Moroccan culture.',
      content: 'The hammam is a weekly ritual for many Moroccans — steam, black soap scrub (beldi) and traditional massage.',
    },
    ar: {
      title: 'الحمام التقليدي',
      description: 'حمام بخار للتطهير والتواصل الاجتماعي في الثقافة المغربية.',
      content: 'الحمام طقس أسبوعي لكثير من المغاربة: بخار، تقشير بالصابون البلدي وتدليك تقليدي.',
    },
    es: {
      title: 'Hammam tradicional',
      description: 'Baño de vapor para la purificación y la vida social marroquí.',
      content: 'El hammam es un ritual semanal: vapor, exfoliación con jabón beldi y masaje tradicional.',
    },
  },
  henna: {
    en: {
      title: 'The Art of Henna',
      description: 'Used for centuries in ceremonies and celebrations as artistic expression.',
      content: 'Henna paste from henna leaves is applied on hands and feet at weddings and festivals, with regional symbolic motifs.',
    },
    ar: {
      title: 'فن الحناء',
      description: 'يُستخدم منذ قرون في الاحتفالات كتعبير فني.',
      content: 'تُطبَّق عجينة الحناء على اليدين والقدمين في الأعراس والأعياد بزخارف رمزية حسب المناطق.',
    },
    es: {
      title: 'El arte del henna',
      description: 'Usado desde hace siglos en ceremonias como expresión artística.',
      content: 'La pasta de henna se aplica en manos y pies en bodas y fiestas, con motivos simbólicos regionales.',
    },
  },
  moussem: {
    en: { title: 'Moussems', description: 'Religious and cultural festivals that gather local communities.', content: 'Annual celebrations honoring a local saint — devotion, markets, music and culture.' },
    ar: { title: 'المواسم', description: 'مهرجانات دينية وثقافية تجمع المجتمعات المحلية.', content: 'احتفالات سنوية تكريماً لوليّ محلي تجمع العبادة والأسواق والموسيقى.' },
    es: { title: 'Moussems', description: 'Festivales religiosos y culturales que reúnen a las comunidades.', content: 'Celebraciones anuales en honor a un santo local: devoción, ferias y música.' },
  },
  ramadan: {
    en: { title: 'Ramadan in Morocco', description: 'A sacred month of fasting, prayer and family sharing.', content: 'Moroccans fast from dawn to sunset; the iftar meal brings families together.' },
    ar: { title: 'رمضان في المغرب', description: 'شهر مقدس للصوم والصلاة والمشاركة العائلية.', content: 'يصوم المغاربة من الفجر إلى الغروب؛ الإفطار لحظة تآلف عائلية.' },
    es: { title: 'Ramadán en Marruecos', description: 'Mes sagrado de ayuno, oración y convivencia familiar.', content: 'El ayuno dura del alba al ocaso; el iftar reúne a las familias.' },
  },
  aid: {
    en: { title: 'Eid al-Fitr & Eid al-Adha', description: 'The two main Muslim festivals celebrated with devotion in Morocco.', content: 'Collective prayers, family meals, gifts for children and charity.' },
    ar: { title: 'عيد الفطر وعيد الأضحى', description: 'العيدان الرئيسيان يُحتفل بهما بتقوى في المغرب.', content: 'صلوات جماعية ووجبات عائلية وهدايا للأطفال وأعمال خيرية.' },
    es: { title: 'Aid el-Fitr y Aid el-Adha', description: 'Las dos grandes fiestas musulmanas celebradas con fervor.', content: 'Oraciones colectivas, comidas en familia, regalos y caridad.' },
  },
  zellige: {
    en: { title: 'Zellige', description: 'Age-old Moroccan mosaic art adorning palaces and mosques.', content: 'Hand-cut glazed ceramic tiles forming hypnotic geometric patterns since the 10th century.' },
    ar: { title: 'الزليج', description: 'فن الفسيفساء المغربي العريق يزيّن القصور والمساجد.', content: 'بلاط خزفي مقطوع يدوياً بزخارف هندسية منذ القرن العاشر.' },
    es: { title: 'Zellige', description: 'Arte milenario del mosaico marroquí en palacios y mezquitas.', content: 'Baldosas esmaltadas cortadas a mano en composiciones geométricas.' },
  },
  pottery: {
    en: { title: 'Fez Pottery', description: 'Famous blue-and-white pottery, a craft passed down generations.', content: 'Cobalt motifs on white — ancestral techniques for unique decorative pieces.' },
    ar: { title: 'فخار فاس', description: 'فخار أزرق وأبيض مشهور، حرفة متوارثة.', content: 'زخارف كوبالت على أبيض بتقنيات عريقة لقطع فريدة.' },
    es: { title: 'Cerámica de Fez', description: 'Famosa cerámica azul y blanca transmitida de generación en generación.', content: 'Motivos cobalto sobre blanco con técnicas ancestrales.' },
  },
  leather: {
    en: { title: 'Leather Craft', description: 'The tanneries of Fez and Marrakech are world-famous.', content: 'Medieval natural methods — lime, saffron, mint — still used today.' },
    ar: { title: 'صناعة الجلد', description: 'مدابغ فاس ومراكش شهيرة عالمياً.', content: 'طرق تقليدية بمواد طبيعية ما زالت مستخدمة اليوم.' },
    es: { title: 'Trabajo del cuero', description: 'Las curtidurías de Fez y Marrakech son famosas en el mundo.', content: 'Métodos medievales con productos naturales aún en uso.' },
  },
  tagine: {
    en: { title: 'Tagine', description: 'Morocco’s emblematic slow-cooked dish in a clay pot.', content: 'Slow cooking preserves flavors — prune, vegetable or coastal fish variations.' },
    ar: { title: 'الطاجين', description: 'الطبق الرمزي للمغرب يُطهى ببطء في آنية فخارية.', content: 'طبخ بطيء يحفظ النكهات بتنويعات حسب المناطق.' },
    es: { title: 'Tajine', description: 'El plato emblemático de Marruecos, cocinado a fuego lento.', content: 'La cocción lenta preserva los sabores según la región.' },
  },
  couscous: {
    en: { title: 'Couscous', description: 'National dish traditionally served on Fridays.', content: 'Hand-rolled grains with meat, vegetables and fragrant broth — Friday family gatherings.' },
    ar: { title: 'الكسكس', description: 'الطبق الوطني يُقدَّم تقليدياً يوم الجمعة.', content: 'حبوب تُحضَّر يدوياً مع لحم وخضار ومرق عطري.' },
    es: { title: 'Cuscús', description: 'Plato nacional servido tradicionalmente los viernes.', content: 'Granos preparados a mano con carne, verduras y caldo aromático.' },
  },
  pastilla: {
    en: { title: 'Pastilla', description: 'Sweet-savory pastry specialty of Fez for special occasions.', content: 'Warqa pastry filled with poultry, almonds and spices, dusted with sugar and cinnamon.' },
    ar: { title: 'البسطيلة', description: 'فطيرة حلوة مالحة من تخصصات فاس للمناسبات.', content: 'ورقة محشوة بالدجاج واللوز والتوابل مع سكر وقرفة.' },
    es: { title: 'Pastilla', description: 'Hojaldre agridulce, especialidad de Fez para ocasiones especiales.', content: 'Masa warqa rellena de ave, almendras y especias con azúcar y canela.' },
  },
  gnawa: {
    en: { title: 'Gnawa Music', description: 'Spiritual rhythmic music with Sub-Saharan roots, popular in Morocco.', content: 'Percussion, spiritual chants and dance with guembri and qraqeb.' },
    ar: { title: 'موسيقى كناوة', description: 'موسيقى روحية إيقاعية ذات أصول صحراوية شائعة في المغرب.', content: 'إيقاعات ورقصات مع الكمبري والقراقب.' },
    es: { title: 'Música Gnawa', description: 'Música espiritual y rítmica de raíces subsaharianas.', content: 'Percusión, cantos espirituales y danza con guembri y qraqeb.' },
  },
  andalous: {
    en: { title: 'Andalusian Music', description: 'Refined heritage from Muslim Spain.', content: 'Classical Moroccan Andalusian music (al-ala) with complex modes and sung poetry.' },
    ar: { title: 'الموسيقى الأندلسية', description: 'إرث راقٍ من الأندلس الإسلامية.', content: 'فن كلاسيكي مغربي بأنماط معقدة وقصائد مغنّاة.' },
    es: { title: 'Música andalusí', description: 'Herencia refinada de la España musulmana.', content: 'Arte clásico marroquí (al-ala) con modos complejos y poesía cantada.' },
  },
  atlas: {
    en: { title: 'High Atlas', description: 'Majestic mountains, cradle of Amazigh culture.', content: 'Berber communities preserve dialects, crafts and festivals; Toubkal draws hikers worldwide.' },
    ar: { title: 'الأطلس الكبير', description: 'جبال شاهقة وموطن الثقافة الأمازيغية.', content: 'مجتمعات تحافظ على لهجاتها وحرفها؛ توبقال يجذب المتسلقين.' },
    es: { title: 'Alto Atlas', description: 'Montañas majestuosas, cuna de la cultura amazigh.', content: 'Comunidades bereberes preservan dialectos y oficios; el Toubkal atrae senderistas.' },
  },
  sahara: {
    en: { title: 'Moroccan Sahara', description: 'Golden dunes, land of nomads and caravans.', content: 'Camel caravans and nomadic camps under unforgettable starry skies.' },
    ar: { title: 'الصحراء المغربية', description: 'كثبان ذهبية وأرض الرحل والقوافل.', content: 'قوافل الجمال ومخيمات تحت سماء مرصعة بالنجوم.' },
    es: { title: 'Sáhara marroquí', description: 'Dunas doradas, tierra de nómadas y caravanas.', content: 'Caravanas de dromedarios y campamentos bajo cielos estrellados.' },
  },
  coast: {
    en: { title: 'Atlantic Coast', description: 'Preserved shoreline with fishing ports and wild beaches.', content: 'Essaouira and Agadir keep authentic charm — fresh fish, markets and music festivals.' },
    ar: { title: 'الساحل الأطلسي', description: 'ساحل محفوظ بموانئ صيد وشواطئ برية.', content: 'الصويرة وأكادير يحافظان على سحر أصيل ومأكولات بحرية ومهرجانات.' },
    es: { title: 'Costa atlántica', description: 'Litoral preservado con puertos pesqueros y playas salvajes.', content: 'Essaouira y Agadir conservan su encanto — pescado fresco y festivales.' },
  },
};

const authenticityI18n = {
  local: {
    en: { label: 'Local experience', description: 'Led by authentic locals' },
    ar: { label: 'تجربة محلية', description: 'يقدّمها سكان محليون أصيلون' },
    es: { label: 'Experiencia local', description: 'Animada por locales auténticos' },
  },
  traditional: {
    en: { label: 'Traditional', description: 'Respect for Moroccan traditions' },
    ar: { label: 'تقليدي', description: 'احترام التقاليد المغربية' },
    es: { label: 'Tradicional', description: 'Respeto a las tradiciones marroquíes' },
  },
  artisanal: {
    en: { label: 'Artisanal', description: 'Preserved craftsmanship' },
    ar: { label: 'حرفي', description: 'حرفة يدوية محفوظة' },
    es: { label: 'Artesanal', description: 'Saber hacer artesanal preservado' },
  },
  cultural: {
    en: { label: 'Cultural', description: 'Deep cultural immersion' },
    ar: { label: 'ثقافي', description: 'انغماس ثقافي عميق' },
    es: { label: 'Cultural', description: 'Inmersión cultural profunda' },
  },
  authentic: {
    en: { label: 'Authentic', description: '100% authentic experience' },
    ar: { label: 'أصيل', description: 'تجربة أصيلة 100٪' },
    es: { label: 'Auténtico', description: 'Experiencia 100% auténtica' },
  },
};

const aboutContent = {
  fr: {
    heroTitle: "À propos d'Overglow Trip",
    heroSubtitle: 'Nous connectons les voyageurs avec des expériences authentiques et mémorables au Maroc.',
    missionTitle: 'Notre mission',
    missionP1: "Chez Overglow Trip, chaque voyage doit être une aventure unique. Nous connectons voyageurs et expériences locales exceptionnelles tout en soutenant les opérateurs locaux.",
    missionP2: "Nous valorisons la qualité, l'authenticité et le respect des communautés, avec une réservation simple et sécurisée.",
    valuesTitle: 'Nos valeurs',
    valueAuthTitle: 'Authenticité',
    valueAuthDesc: 'Des expériences qui reflètent la vraie culture locale.',
    valueCommunityTitle: 'Communauté',
    valueCommunityDesc: 'Nous soutenons les opérateurs locaux et un tourisme durable.',
    valueExcellenceTitle: 'Excellence',
    valueExcellenceDesc: 'La meilleure expérience possible pour chaque voyageur.',
    ctaTitle: 'Rejoignez-nous',
    ctaText: "Voyageur ou partenaire : Overglow Trip est fait pour vous.",
    ctaRegister: 'Créer un compte',
    ctaPartner: 'Devenir partenaire',
  },
  en: {
    heroTitle: 'About Overglow Trip',
    heroSubtitle: 'We connect travelers with authentic, memorable experiences in Morocco.',
    missionTitle: 'Our mission',
    missionP1: 'At Overglow Trip, every trip should be unique. We connect travelers with outstanding local experiences while supporting local operators.',
    missionP2: 'We value quality, authenticity and community respect, with simple and secure booking.',
    valuesTitle: 'Our values',
    valueAuthTitle: 'Authenticity',
    valueAuthDesc: 'Experiences that reflect real local culture.',
    valueCommunityTitle: 'Community',
    valueCommunityDesc: 'We support local operators and sustainable tourism.',
    valueExcellenceTitle: 'Excellence',
    valueExcellenceDesc: 'The best possible experience for every traveler.',
    ctaTitle: 'Join us',
    ctaText: 'Traveler or partner — Overglow Trip is for you.',
    ctaRegister: 'Create an account',
    ctaPartner: 'Become a partner',
  },
  ar: {
    heroTitle: 'عن Overglow Trip',
    heroSubtitle: 'نربط المسافرين بتجارب أصيلة لا تُنسى في المغرب.',
    missionTitle: 'مهمتنا',
    missionP1: 'في Overglow Trip يجب أن تكون كل رحلة فريدة. نربط المسافرين بتجارب محلية مميزة مع دعم المشغّلين المحليين.',
    missionP2: 'نثمّن الجودة والأصالة واحترام المجتمعات مع حجز بسيط وآمن.',
    valuesTitle: 'قيمنا',
    valueAuthTitle: 'الأصالة',
    valueAuthDesc: 'تجارب تعكس الثقافة المحلية الحقيقية.',
    valueCommunityTitle: 'المجتمع',
    valueCommunityDesc: 'ندعم المشغّلين المحليين والسياحة المستدامة.',
    valueExcellenceTitle: 'التميّز',
    valueExcellenceDesc: 'أفضل تجربة ممكنة لكل مسافر.',
    ctaTitle: 'انضم إلينا',
    ctaText: 'مسافر أو شريك — Overglow Trip لك.',
    ctaRegister: 'إنشاء حساب',
    ctaPartner: 'كن شريكاً',
  },
  es: {
    heroTitle: 'Sobre Overglow Trip',
    heroSubtitle: 'Conectamos viajeros con experiencias auténticas e inolvidables en Marruecos.',
    missionTitle: 'Nuestra misión',
    missionP1: 'En Overglow Trip cada viaje debe ser único. Conectamos viajeros con experiencias locales excepcionales apoyando a operadores locales.',
    missionP2: 'Valoramos calidad, autenticidad y respeto a las comunidades, con reservas simples y seguras.',
    valuesTitle: 'Nuestros valores',
    valueAuthTitle: 'Autenticidad',
    valueAuthDesc: 'Experiencias que reflejan la cultura local real.',
    valueCommunityTitle: 'Comunidad',
    valueCommunityDesc: 'Apoyamos a operadores locales y un turismo sostenible.',
    valueExcellenceTitle: 'Excelencia',
    valueExcellenceDesc: 'La mejor experiencia posible para cada viajero.',
    ctaTitle: 'Únete',
    ctaText: 'Viajero o partner: Overglow Trip es para ti.',
    ctaRegister: 'Crear una cuenta',
    ctaPartner: 'Hazte partner',
  },
};

const localizeItem = (item, lang) => {
  if (lang === 'fr' || !cultureTranslations[item.id]) return { ...item };
  const tr = cultureTranslations[item.id][lang];
  if (!tr) return { ...item };
  return {
    ...item,
    title: tr.title || item.title,
    description: tr.description || item.description,
    content: tr.content || item.content,
    dates: item.dates,
  };
};

export const getAboutContent = (lang) => {
  const locale = normalizeLang(lang);
  return aboutContent[locale] || aboutContent[DEFAULT_LANG];
};

export const getCultureContent = (lang) => {
  const locale = normalizeLang(lang);
  const sections = {};
  for (const [key, items] of Object.entries(moroccanCultureData)) {
    sections[key] = items.map((item) => localizeItem(item, locale));
  }
  const tags = frAuthTags.map((tag) => {
    if (locale === 'fr') return tag;
    const tr = authenticityI18n[tag.id]?.[locale];
    return tr ? { ...tag, label: tr.label, description: tr.description } : tag;
  });
  return { sections, authenticityTags: tags, lang: locale };
};

export default { getAboutContent, getCultureContent };
