# 03 — GDPR / ePrivacy (aligné V1)

## Déjà en place (code)

- Bandeau cookies / préférences (`CookieBanner`, pages `/cookies`, `/cookie-consent`, `/privacy`).  
- Consentement analytics/marketing conditionnel (pas de tracking sans consent quand le bandeau est actif).  
- Contenu légal : pages Terms / Privacy / Accessibility — à faire valider par avocat avant prod juridique.

## Principes à respecter en code

- Minimisation des données collectées (compte, booking, messages).  
- Pas de logs PII (emails, téléphone) dans `logger`.  
- Droit d’accès / suppression : flux support + outils admin users (suppression admin existante — documenter procédure métier).  
- Avis : uniquement ceux `Approved` en public.  
- Notes internes opérateurs (`adminNotes`) : jamais exposées au public.

## Checklist avant claim « GDPR ready »

- [ ] Textes Privacy/Terms validés avocat  
- [ ] Emails DPO / contact réels  
- [ ] Politique rétention bookings/avis définie  
- [ ] Export données utilisateur (si requis métier)  
- [ ] Sous-traitants listés (MongoDB Atlas, Cloudinary, Stripe, Vercel, email)

Ne pas inventer de certifications ou labels non obtenus.
