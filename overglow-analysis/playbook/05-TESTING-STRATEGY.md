# 05 — Stratégie de tests (pragmatique V1)

## Niveaux réalistes

| Niveau | Outil / action | Priorité soft-launch |
|--------|----------------|----------------------|
| Smoke API | `node scripts/smokeAdminBo.js` | P0 |
| Smoke manuel BO | Login → badges / produits edit / opérateurs / FAQ / bookings | P0 |
| Smoke public | Home, search, fiche produit, blog, FAQ, cookies | P0 |
| Unit / intégration | Scripts `scripts/test-*.js` existants | P1 |
| E2E Playwright | À étendre si CI le demande | P2 |

## Parcours BO à valider après chaque lot admin

1. Login `POST /api/auth/login`  
2. Badges : list / edit critères / assign / unassign  
3. Produits : éditer `/admin/products/:id/edit`  
4. Opérateurs : PUT fiche + suspend/reactivate  
5. FAQ : create / toggle / delete  
6. Pas d’`alert()` bloquant  

## Ce qu’on ne revendique pas

- Coverage 70 % globale déjà atteinte  
- Suite Playwright complète green en CI  

Documenter les tests **réellement** ajoutés dans le commit, pas des cibles marketing.
