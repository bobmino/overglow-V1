# Compliance fournisseurs Maroc — Overglow Trip

Synthèse CTO soft-launch. **Pas un avis juridique** — à faire valider par un conseil marocain avant d’ouvrir les catégories réglementées à grande échelle.

## Décisions produit

| Sujet | Décision |
|---|---|
| Soft-launch | Collecte docs + checklist dynamique + **revue admin manuelle** |
| Publication produits | **Non bloquée** tant que docs non `verified` (V2) |
| APIs CIN / OMPIC | **Non** en auto — DirectInfo / listes ministère en contrôle humain |
| CNDP | Copies CNIE = données sensibles → dossier CNDP avant scale KYC |

## Typologie

- **Statut légal** : `company` · `auto_entrepreneur` · `individual` (draft)
- **Secteurs** (`activitySectors`) : taxi, transport touristique, location véhicules, hébergement classé, guide agréé, agence voyages, activités, photo, conciergerie, chauffeur privé

Code source : [`backend/config/operatorComplianceMatrix.js`](../backend/config/operatorComplianceMatrix.js)

## Exemples de checklist

### Taxi
Champs : CNIE, permis conduire, permis de confiance, agrément/contrat, plaque, catégorie.  
Docs : copies CNIE + permis + permis de confiance + contrat exploitation + carte grise + assurance.

### Location de voitures
Champs : ICE, RC, n° autorisation.  
Docs : extrait RC, ICE, autorisation location, assurance flotte.  
Société attendue (cahier des charges 2024).

### Hébergement (loi 80-14)
Autorisation d’exploitation, classement, titre/bail, assurance.

### Guide (loi 05-12)
CNIE + carte/agrément guide.

## Concurrence (patterns UX)

1. Choisir statut légal  
2. Choisir secteurs  
3. Checklist contextuelle  
4. Upload + revue humaine  
5. Publication / payout séparés  

Références : GetYourGuide verification, Viator compliance, Airbnb identity.

## APIs / registres

- **OMPIC / DirectInfo** : contrôle RC/ICE manuel ou contractuel — pas de scraping.
- **Listes guides / agents** (ministère) : match manuel.
- **PSP marketplace** (V2) : KYC/KYB payout.
- **Jamais** d’API CIN « maison » sans autorisation CNDP.

## Phases

**Maintenant** : matrice + wizard + admin verify/reject.  
**V2** : bloquer publish si non verified ; PSP ; rappels expiration ; DirectInfo contractuel.

## Sources utiles

- [OMPIC ICE](http://www.ompic.ma/fr/content/identifiant-commun-de-lentreprise)
- [Transport touristique MTAESS](https://mtaess.gov.ma/fr/tourisme/metiers-tourisme/transport-touristique/)
- [Hébergement / classement](https://mtaess.gov.ma/fr/tourisme/metiers-tourisme/hebergement-touristique/)
- [Guides](https://mtaess.gov.ma/guides-de-tourisme/)
- [Agents de voyages](https://mtaess.gov.ma/fr/tourisme/metiers-tourisme/agents-de-voyages/)
- [CNDP](https://www.cndp.ma/traitement-des-donnees-personnelles-au-maroc/)
