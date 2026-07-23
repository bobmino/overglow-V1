# Système de badges Overglow Trip

Document de référence pour la direction / admin. Mis à jour soft-launch.

## Principes (hybride)

| Catégorie | Qui l’obtient | Qui contrôle | Cible |
|-----------|---------------|--------------|--------|
| **Mérite** (`merit`) | Automatique dès que les métriques matchent | Admin peut **forcer** ou **révoquer** | Opérateur (et badges marketing produit) |
| **Nature** (`nature`) | Manuel uniquement | Admin assigne / révoque ; l’opérateur peut **demander** | **Opérateur** (qualifie le prestataire) |
| **Produit** (`product`) | Auto ou marketing | Admin force / révoque | Produit |

Règle métier : un badge « Artisan / Éco / Traditionnel » **nature** s’applique à l’**opérateur**. Les flags `authenticity.*` sont mis à jour à l’assignation manuelle.

---

## Badges opérateur — mérite (auto)

Seuils **soft-launch** (plus bas pour démarrer) ; production cible entre parenthèses.

### SuperOpérateur

- **Formule soft-launch :**  
  `totalBookings >= 10` **ET** `averageRating >= 4.3` **ET** `completionRate >= 90` **ET** (`responseTime == null` **OU** `responseTime <= 24`)
- **Cible prod :** `bookings >= 50`, `rating >= 4.5`, `completion >= 95`, `response <= 24h`
- **Signification :** gère bien ses résas, bons avis, communication réactive.
- **Admin :** peut octroyer manuellement (exception VIP) ou retirer.

### Réponse Rapide (Réactif)

- `responseTime <= 2` (heures, moyenne)
- Soft-launch : même seuil.

### Opérateur de Confiance (Fiable)

- Soft-launch : `totalBookings >= 20` **ET** `completionRate >= 90`
- Prod : `>= 100` résas **ET** `>= 95 %`

### Meilleur Opérateur / Top noté

- Soft-launch : `totalBookings >= 10` **ET** `averageRating >= 4.5`
- Prod : `>= 50` **ET** `>= 4.5`

### Vérifié

- Flag `metrics.isVerified === true` (posé à l’approval compte Active).

### 100% Marocain / Local Authentique

- Auto si flags `isLocal` + `isLocal100` / `isAuthenticLocal` (souvent posés à l’onboarding ou admin).

---

## Badges opérateur — nature (manuel)

| Badge | Flag authenticity | Qui assigne |
|-------|-------------------|-------------|
| Artisan authentique | `isArtisan` | Admin (+ demande opérateur) |
| Éco-responsable | `isEcoFriendly` | Admin |
| Traditionnel | `isTraditional` | Admin |
| Local Authentique | `isAuthenticLocal` | Admin ou auto si flag |

**Assignation :** Admin → Badges → onglet « Assigner aux opérateurs ».  
**Demande :** opérateur via modal demande badge (produit/opérateur) → `/admin/badge-requests`.

---

## Badges produit (marketing / mérite)

| Badge | Règle |
|-------|--------|
| Populaire | `bookingCount >= 10` |
| Meilleure Valeur | `isBestValue` |
| Skip-the-Line | `skipTheLine.enabled` |
| Nouveau | produit &lt; 30 jours (`isNew`) |
| Dernières Places | `isLastMinute` |
| Excellent | `rating >= 4.5` **ET** `reviews >= 5` |

Les badges nature **produit** historiques (Artisan produit…) restent assignables manuellement mais la **qualification prestataire** se fait côté opérateur.

---

## Gestion admin (checklist)

1. `POST /api/admin/initialize-badges` (ou bouton UI) pour synchroniser le catalogue de badges.
2. Filtrer Mérite / Nature / Produit dans `/admin/badges`.
3. Forcer assign / unassign opérateurs et produits.
4. Révoquer un badge mérite si abus (unassign) — le moteur peut le reposer si critères toujours vrais ; dans ce cas suspendre le badge (`isActive: false`) ou ajuster les métriques.

---

## Où ça tourne dans le code

- Modèle : `backend/models/badgeModel.js` (`category`, `isAutomatic`, `criteria`)
- Moteur : `backend/utils/badgeService.js` (`assignOperatorBadges`, `initializeDefaultBadges`)
- UI : `frontend/src/pages/AdminBadgeManagementPage.jsx`
