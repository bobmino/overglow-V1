/**
 * FAQ seed — 4 languages, managed in MongoDB (no hardcoded UI content).
 * Idempotent key: question + language.
 */
export const FAQ_SEED = [
  // FR
  {
    language: 'fr',
    category: 'booking',
    order: 1,
    question: 'Comment réserver une expérience sur Overglow Trip ?',
    answer:
      'Choisissez une expérience, sélectionnez la date et le créneau, le nombre de participants, puis validez le panier. Vous recevez une confirmation par e-mail dès que le paiement (ou la validation manuelle) est accepté.',
    tags: ['réservation', 'booking'],
  },
  {
    language: 'fr',
    category: 'cancellation',
    order: 2,
    question: 'Puis-je annuler ma réservation ?',
    answer:
      'Oui, selon la politique d’annulation de chaque expérience (gratuite, modérée, stricte ou non remboursable). Elle est affichée sur la fiche produit et avant paiement. Le remboursement éventuel suit ce délai et ce pourcentage.',
    tags: ['annulation', 'remboursement'],
  },
  {
    language: 'fr',
    category: 'payment',
    order: 3,
    question: 'Quels moyens de paiement sont acceptés ?',
    answer:
      'Carte bancaire (Stripe) lorsque activé, et d’autres méthodes configurées par Overglow (virement / espèces selon les expériences). Les devises affichées dépendent de vos préférences et du catalogue.',
    tags: ['paiement', 'stripe'],
  },
  {
    language: 'fr',
    category: 'safety',
    order: 4,
    question: 'Le Maroc est-il sûr pour les voyageurs ?',
    answer:
      'Des millions de visiteurs y voyagent chaque année. Appliquez les précautions urbaines habituelles, privilégiez des opérateurs vérifiés, et conservez une copie de vos documents. En urgence au Maroc : police 19/190, pompiers/SAMU 15, gendarmerie 177.',
    tags: ['sécurité'],
  },
  {
    language: 'fr',
    category: 'operator',
    order: 5,
    question: 'Comment devenir opérateur partenaire ?',
    answer:
      'Inscrivez-vous via « Devenir partenaire », complétez votre profil et soumettez vos expériences. L’équipe Overglow vérifie les informations avant publication. Consultez aussi l’aide opérateur et les ressources partenaires.',
    tags: ['opérateur', 'partenaire'],
  },
  {
    language: 'fr',
    category: 'account',
    order: 6,
    question: 'Comment gérer mon compte et mes réservations ?',
    answer:
      'Connectez-vous puis ouvrez votre espace voyageur (tableau de bord) pour voir vos réservations, annuler si la politique le permet, et mettre à jour votre profil.',
    tags: ['compte'],
  },
  {
    language: 'fr',
    category: 'reviews',
    order: 7,
    question: 'Qui peut laisser un avis ?',
    answer:
      'Seuls les voyageurs ayant une réservation confirmée peuvent publier un avis. Les avis sont modérés (approbation) avant d’apparaître publiquement. Les notes affichées sont calculées à partir des avis approuvés en base.',
    tags: ['avis'],
  },
  {
    language: 'fr',
    category: 'general',
    order: 8,
    question: 'Comment contacter le support Overglow ?',
    answer:
      'Utilisez le Centre d’aide / Contact, ou la messagerie de votre compte pour une réservation en cours. Indiquez votre numéro de réservation pour un traitement plus rapide.',
    tags: ['support', 'contact'],
  },

  // EN
  {
    language: 'en',
    category: 'booking',
    order: 1,
    question: 'How do I book an experience on Overglow Trip?',
    answer:
      'Pick an experience, choose date and time slot, set party size, then checkout. You get an email confirmation once payment (or manual validation) is accepted.',
    tags: ['booking'],
  },
  {
    language: 'en',
    category: 'cancellation',
    order: 2,
    question: 'Can I cancel my booking?',
    answer:
      'Yes, according to each experience’s cancellation policy (free, moderate, strict, or non-refundable). It is shown on the product page and before payment. Any refund follows that window and percentage.',
    tags: ['cancellation', 'refund'],
  },
  {
    language: 'en',
    category: 'payment',
    order: 3,
    question: 'Which payment methods are accepted?',
    answer:
      'Card payments via Stripe when enabled, plus other methods configured by Overglow (bank transfer / cash for some experiences). Displayed currency depends on your preferences and the catalogue.',
    tags: ['payment'],
  },
  {
    language: 'en',
    category: 'safety',
    order: 4,
    question: 'Is Morocco safe for travellers?',
    answer:
      'Millions of visitors travel there every year. Use normal city awareness, prefer verified operators, and keep copies of your documents. Morocco emergencies: police 19/190, fire/medical 15, gendarmerie 177.',
    tags: ['safety'],
  },
  {
    language: 'en',
    category: 'operator',
    order: 5,
    question: 'How do I become a partner operator?',
    answer:
      'Sign up via Become a partner, complete your profile, and submit experiences. Overglow reviews details before publishing. See operator help and partner resources for next steps.',
    tags: ['operator'],
  },
  {
    language: 'en',
    category: 'account',
    order: 6,
    question: 'How do I manage my account and bookings?',
    answer:
      'Sign in and open your traveller dashboard to view bookings, cancel when the policy allows, and update your profile.',
    tags: ['account'],
  },
  {
    language: 'en',
    category: 'reviews',
    order: 7,
    question: 'Who can leave a review?',
    answer:
      'Only travellers with a confirmed booking can submit a review. Reviews are moderated before they appear publicly. Ratings are computed from approved reviews in the database.',
    tags: ['reviews'],
  },
  {
    language: 'en',
    category: 'general',
    order: 8,
    question: 'How can I contact Overglow support?',
    answer:
      'Use Help / Contact, or in-app messaging for an active booking. Include your booking reference for faster handling.',
    tags: ['support'],
  },

  // ES
  {
    language: 'es',
    category: 'booking',
    order: 1,
    question: '¿Cómo reservo una experiencia en Overglow Trip?',
    answer:
      'Elige una experiencia, selecciona fecha y horario, el número de personas y completa el pago. Recibirás un email de confirmación cuando el pago (o la validación manual) sea aceptado.',
    tags: ['reserva'],
  },
  {
    language: 'es',
    category: 'cancellation',
    order: 2,
    question: '¿Puedo cancelar mi reserva?',
    answer:
      'Sí, según la política de cada experiencia (gratuita, moderada, estricta o no reembolsable). Se muestra en la ficha y antes del pago. El reembolso sigue ese plazo y porcentaje.',
    tags: ['cancelación'],
  },
  {
    language: 'es',
    category: 'payment',
    order: 3,
    question: '¿Qué métodos de pago se aceptan?',
    answer:
      'Tarjeta (Stripe) cuando esté activo, y otros métodos configurados por Overglow. La moneda mostrada depende de tus preferencias y del catálogo.',
    tags: ['pago'],
  },
  {
    language: 'es',
    category: 'safety',
    order: 4,
    question: '¿Es seguro viajar a Marruecos?',
    answer:
      'Millones de visitantes viajan cada año. Usa precauciones habituales, operadores verificados y copia de documentos. Emergencias: policía 19/190, bomberos/SAMU 15, gendarmería 177.',
    tags: ['seguridad'],
  },
  {
    language: 'es',
    category: 'operator',
    order: 5,
    question: '¿Cómo ser operador asociado?',
    answer:
      'Regístrate en « Convertirse en socio », completa tu perfil y envía experiencias. Overglow verifica antes de publicar.',
    tags: ['operador'],
  },
  {
    language: 'es',
    category: 'account',
    order: 6,
    question: '¿Cómo gestiono mi cuenta y reservas?',
    answer:
      'Inicia sesión y abre tu panel de viajero para ver reservas, cancelar si la política lo permite y actualizar tu perfil.',
    tags: ['cuenta'],
  },
  {
    language: 'es',
    category: 'reviews',
    order: 7,
    question: '¿Quién puede dejar una opinión?',
    answer:
      'Solo viajeros con reserva confirmada. Las opiniones se moderan antes de publicarse. Las notas se calculan con opiniones aprobadas en la base de datos.',
    tags: ['opiniones'],
  },
  {
    language: 'es',
    category: 'general',
    order: 8,
    question: '¿Cómo contacto con soporte?',
    answer:
      'Usa Ayuda / Contacto o el chat de tu cuenta para una reserva activa. Incluye el número de reserva.',
    tags: ['soporte'],
  },

  // AR
  {
    language: 'ar',
    category: 'booking',
    order: 1,
    question: 'كيف أحجز تجربة على Overglow Trip؟',
    answer:
      'اختر تجربة، حدد التاريخ والوقت وعدد المشاركين، ثم أكمل الدفع. تصلك رسالة تأكيد عند قبول الدفع أو التحقق اليدوي.',
    tags: ['حجز'],
  },
  {
    language: 'ar',
    category: 'cancellation',
    order: 2,
    question: 'هل يمكنني إلغاء حجزي؟',
    answer:
      'نعم، وفق سياسة إلغاء كل تجربة (مجاني، معتدل، صارم، أو غير قابل للاسترداد). تظهر على صفحة المنتج وقبل الدفع.',
    tags: ['إلغاء'],
  },
  {
    language: 'ar',
    category: 'payment',
    order: 3,
    question: 'ما وسائل الدفع المقبولة؟',
    answer:
      'بطاقة عبر Stripe عند التفعيل، ووسائل أخرى يضبطها Overglow حسب التجربة والعملة المعروضة.',
    tags: ['دفع'],
  },
  {
    language: 'ar',
    category: 'safety',
    order: 4,
    question: 'هل السفر إلى المغرب آمن؟',
    answer:
      'يزور المغرب ملايين المسافرين سنوياً. التزم بالحيطة المعتادة واختر مشغّلين موثّقين. للطوارئ: الشرطة 19/190، الإسعاف/الإطفاء 15، الدرك 177.',
    tags: ['أمان'],
  },
  {
    language: 'ar',
    category: 'operator',
    order: 5,
    question: 'كيف أصبح مشغّلاً شريكاً؟',
    answer:
      'سجّل عبر « كن شريكاً »، أكمل ملفك وقدّم تجاربك. يراجعها فريق Overglow قبل النشر.',
    tags: ['مشغل'],
  },
  {
    language: 'ar',
    category: 'account',
    order: 6,
    question: 'كيف أدير حسابي وحجوزاتي؟',
    answer:
      'سجّل الدخول وافتح لوحة المسافر لعرض الحجوزات والإلغاء عند السماح وتحديث الملف.',
    tags: ['حساب'],
  },
  {
    language: 'ar',
    category: 'reviews',
    order: 7,
    question: 'من يمكنه ترك تقييم؟',
    answer:
      'فقط المسافرون بحجز مؤكد. تُراجع التقييمات قبل الظهور. تعتمد التقييمات المعروضة على التقييمات المعتمدة في قاعدة البيانات.',
    tags: ['تقييم'],
  },
  {
    language: 'ar',
    category: 'general',
    order: 8,
    question: 'كيف أتواصل مع الدعم؟',
    answer:
      'استخدم مركز المساعدة / اتصل بنا، أو رسائل الحساب لحجز نشط. أرفق رقم الحجز لتسريع المعالجة.',
    tags: ['دعم'],
  },

  // --- Enrichissement Wave 2 (parcours Booking-like) ---
  {
    language: 'fr',
    category: 'payment',
    order: 10,
    question: 'Le paiement en ligne est-il obligatoire ?',
    answer:
      'Pas toujours. Certaines expériences acceptent un paiement différé (virement ou validation manuelle). Votre réservation reste en attente jusqu’à confirmation. Les cartes Stripe/PayPal/CMI seront activées dès que les comptes marchands sont prêts.',
    tags: ['paiement', 'différé', 'virement'],
  },
  {
    language: 'fr',
    category: 'booking',
    order: 11,
    question: 'Que dois-je préparer avant l’expérience ?',
    answer:
      'Vérifiez le point de rendez-vous, l’heure, les documents demandés (pièce d’identité, vouchers) et la politique d’annulation sur la fiche produit. En cas de doute, contactez l’opérateur via la messagerie du compte.',
    tags: ['rdv', 'documents', 'préparation'],
  },
  {
    language: 'fr',
    category: 'operator',
    order: 12,
    question: 'Comment publier un produit et retirer mes revenus ?',
    answer:
      'Complétez l’onboarding partenaire (3 étapes), créez votre expérience, puis soumettez-la à validation. Les retraits se gèrent depuis l’espace opérateur → Retraits, une fois le solde disponible et le compte validé.',
    tags: ['publier', 'retrait', 'partenaire'],
  },
  {
    language: 'en',
    category: 'payment',
    order: 10,
    question: 'Is online payment mandatory?',
    answer:
      'Not always. Some experiences allow deferred payment (bank transfer or manual validation). Your booking stays pending until confirmed. Card payments (Stripe/PayPal/CMI) go live once merchant accounts are ready.',
    tags: ['payment', 'deferred'],
  },
  {
    language: 'en',
    category: 'booking',
    order: 11,
    question: 'What should I prepare before the experience?',
    answer:
      'Check the meeting point, time, required documents (ID, vouchers) and the cancellation policy on the product page. If unsure, message the operator from your account.',
    tags: ['meeting', 'documents'],
  },
  {
    language: 'en',
    category: 'operator',
    order: 12,
    question: 'How do I publish a product and withdraw earnings?',
    answer:
      'Complete the 3-step partner onboarding, create your experience, then submit it for review. Withdrawals are in Operator → Withdrawals once your balance is available and your account is approved.',
    tags: ['publish', 'withdrawal'],
  },
  {
    language: 'es',
    category: 'payment',
    order: 10,
    question: '¿Es obligatorio pagar en línea?',
    answer:
      'No siempre. Algunas experiencias permiten pago diferido (transferencia o validación manual). La reserva queda pendiente hasta confirmación. Las tarjetas se activarán cuando existan cuentas de comercio.',
    tags: ['pago', 'diferido'],
  },
  {
    language: 'es',
    category: 'booking',
    order: 11,
    question: '¿Qué debo preparar antes de la experiencia?',
    answer:
      'Revisa el punto de encuentro, la hora, los documentos pedidos y la política de cancelación en la ficha. Ante dudas, escribe al operador desde tu cuenta.',
    tags: ['encuentro', 'documentos'],
  },
  {
    language: 'es',
    category: 'operator',
    order: 12,
    question: '¿Cómo publico un producto y retiro ingresos?',
    answer:
      'Completa el onboarding de 3 pasos, crea tu experiencia y envíala a revisión. Los retiros están en Operador → Retiros cuando el saldo esté disponible.',
    tags: ['publicar', 'retiro'],
  },
  {
    language: 'ar',
    category: 'payment',
    order: 10,
    question: 'هل الدفع عبر الإنترنت إلزامي؟',
    answer:
      'ليس دائمًا. بعض التجارب تقبل دفعًا مؤجّلًا (تحويل أو تأكيد يدوي). يبقى الحجز معلّقًا حتى التأكيد. بطاقات Stripe/PayPal/CMI تُفعَّل عند جاهزية الحسابات.',
    tags: ['دفع', 'مؤجل'],
  },
  {
    language: 'ar',
    category: 'booking',
    order: 11,
    question: 'ماذا أحضّر قبل التجربة؟',
    answer:
      'تحقّق من نقطة اللقاء والوقت والمستندات المطلوبة وسياسة الإلغاء في صفحة المنتج. عند الشك راسل المشغّل من حسابك.',
    tags: ['لقاء', 'مستندات'],
  },
  {
    language: 'ar',
    category: 'operator',
    order: 12,
    question: 'كيف أنشر منتجًا وأسحب أرباحي؟',
    answer:
      'أكمل إعداد الشريك من 3 خطوات، أنشئ تجربتك ثم أرسلها للمراجعة. السحوبات من مساحة المشغّل → السحوبات عند توفر الرصيد.',
    tags: ['نشر', 'سحب'],
  },
];
