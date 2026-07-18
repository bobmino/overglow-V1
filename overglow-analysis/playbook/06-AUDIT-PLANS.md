# 06 — Plans d’audit (checklists V1)

## Sécurité (P0)

- [ ] Pas de secrets dans le git  
- [ ] `JWT_SECRET` fort en prod  
- [ ] Helmet / CORS origines explicites  
- [ ] Uploads authentifiés  
- [ ] Webhooks signés  
- [ ] Rate limit auth  
- [ ] Product schema `strict: true`  
- [ ] Blog HTML whitelist  
- [ ] Pas d’exposition stack en prod  

## Contenu / authenticité

- [ ] Avis publics = Approved only  
- [ ] Pas de faux Trustpilot / jobs / presse  
- [ ] FAQ & blog en Mongo  
- [ ] Seeds idempotents  

## Perf mobile

- [ ] Lighthouse mobile page d’accueil  
- [ ] Images lazy / Cloudinary  
- [ ] Bundle routes lazy (`App.jsx`)  

## Accessibilité

- [ ] Page `/accessibility` honnête  
- [ ] Focus / contraste formulaires clés  
- [ ] RTL AR smoke  

## BO UX

Voir [`../BACKOFFICE-UX-AUDIT.md`](../BACKOFFICE-UX-AUDIT.md) — critère : direction peut opérer sans Mongo Compass.
