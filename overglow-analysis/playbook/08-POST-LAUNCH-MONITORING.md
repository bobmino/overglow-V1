# 08 — Monitoring post-lancement

## Outils

| Domaine | Outil |
|---------|--------|
| Erreurs | Sentry (front + back si DSN) |
| Uptime | Health `/api/health` + moniteur externe |
| Analytics | GA4 seulement avec consentement cookies |
| Logs | `logger` serveur ; pas de PII |
| Paiements | Dashboard Stripe/PayPal + file admin pending |

## Premières 48 h

- [ ] Taux d’erreur Sentry  
- [ ] Bookings créés / échoués  
- [ ] Webhooks 4xx/5xx  
- [ ] Temps réponse API  
- [ ] Feedback opérateurs (messages)  

## Incidents

1. Identifier surface (API / front / paiement / DB)  
2. Mitiger (feature flag, différé booking, rollback Vercel)  
3. Noter dans un log incident (date, impact, fix)  
4. Ne jamais « patch » secrets dans le chat public  

## Budgets perf (cibles)

- LCP mobile &lt; 2.5s pages clés  
- Pas de régression bundle sans justification  
