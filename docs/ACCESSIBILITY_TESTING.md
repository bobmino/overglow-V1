# Tests d'Accessibilité (WCAG 2.1 AA)

## Vue d'ensemble

Les tests d'accessibilité vérifient que l'application respecte les standards WCAG 2.1 Level AA pour l'accessibilité web.

## Outils utilisés

- **axe-core** : Moteur d'accessibilité automatique
- **cypress-axe** : Intégration Cypress pour axe-core

## Installation

Les dépendances sont déjà installées. Si besoin :

```bash
cd frontend
npm install --save-dev @axe-core/cli cypress-axe
```

## Exécution des tests

```bash
cd frontend

# Exécuter tous les tests d'accessibilité
npm run cypress:run -- --spec "cypress/e2e/accessibility.cy.js"

# Mode interactif
npm run cypress:open
# Puis sélectionner accessibility.cy.js
```

## Standards WCAG 2.1 AA testés

### 1. Perceptible

#### 1.1 Alternatives textuelles
- ✅ **Images** : Toutes les images ont un attribut `alt`
- ✅ **Médias** : Alternatives pour le contenu audio/vidéo

#### 1.3 Adaptable
- ✅ **Structure** : Hiérarchie de titres correcte (h1 → h2 → h3)
- ✅ **Labels** : Tous les champs de formulaire ont des labels
- ✅ **Landmarks** : Régions ARIA appropriées (header, main, footer)

#### 1.4 Distinguable
- ✅ **Contraste** : Ratio de contraste minimum 4.5:1 pour le texte
- ✅ **Couleur** : L'information n'est pas véhiculée uniquement par la couleur

### 2. Utilisable

#### 2.1 Accessible au clavier
- ✅ **Navigation** : Tous les éléments interactifs sont accessibles au clavier
- ✅ **Focus** : L'indicateur de focus est visible
- ✅ **Pièges** : Pas de pièges au clavier dans les modales

#### 2.4 Navigable
- ✅ **Titres** : Titres de page descriptifs
- ✅ **Liens** : Liens avec texte descriptif
- ✅ **Skip links** : Liens pour sauter la navigation

#### 2.5 Modalités d'entrée
- ✅ **Cibles** : Taille minimale des cibles tactiles (44x44px)

### 3. Compréhensible

#### 3.1 Lisible
- ✅ **Langue** : Attribut `lang` sur l'élément `<html>`
- ✅ **Erreurs** : Messages d'erreur clairs et accessibles

#### 3.2 Prévisible
- ✅ **Navigation** : Navigation cohérente
- ✅ **Changements** : Changements de contexte annoncés

#### 3.3 Assistance à la saisie
- ✅ **Erreurs** : Identification et description des erreurs
- ✅ **Labels** : Instructions et labels pour les formulaires

### 4. Robuste

#### 4.1 Compatible
- ✅ **ARIA** : Attributs ARIA valides et corrects
- ✅ **HTML** : Structure HTML sémantique

## Tests automatisés

### Tests axe-core

Les tests suivants sont exécutés automatiquement :

1. **color-contrast** : Contraste des couleurs
2. **keyboard-navigation** : Navigation au clavier
3. **aria-required-attr** : Attributs ARIA requis
4. **aria-valid-attr-value** : Valeurs ARIA valides
5. **button-name** : Noms de boutons
6. **image-alt** : Texte alternatif des images
7. **label** : Labels de formulaire
8. **link-name** : Noms de liens
9. **page-has-heading-one** : Présence d'un h1
10. **region** : Régions ARIA

### Tests manuels Cypress

1. **Hiérarchie de titres** : Vérification de l'ordre h1 → h2 → h3
2. **Labels de formulaire** : Association label/input via `for` et `id`
3. **Alt text** : Présence d'attributs `alt` sur les images
4. **ARIA labels** : Labels ARIA pour les éléments interactifs
5. **Navigation clavier** : Tabulation et focus visible
6. **Contraste** : Vérification du contraste des couleurs
7. **Skip links** : Liens pour sauter la navigation
8. **Langue** : Attribut `lang` sur `<html>`
9. **Messages d'erreur** : ARIA live regions pour les erreurs
10. **Focus management** : Gestion du focus dans les modales
11. **Landmarks** : Régions ARIA appropriées
12. **Tables** : Structure correcte des tableaux

## Bonnes pratiques

### 1. Images

```jsx
// ✅ Bon
<img src="product.jpg" alt="Produit Marrakech - Visite guidée" />

// ❌ Mauvais
<img src="product.jpg" />
<img src="product.jpg" alt="" /> // Image décorative uniquement
```

### 2. Formulaires

```jsx
// ✅ Bon
<label htmlFor="email">Email</label>
<input type="email" id="email" name="email" />

// ❌ Mauvais
<input type="email" name="email" placeholder="Email" />
```

### 3. Boutons

```jsx
// ✅ Bon
<button aria-label="Fermer la modal">×</button>
<button>Envoyer</button>

// ❌ Mauvais
<button>×</button> // Pas de texte visible
```

### 4. Navigation

```jsx
// ✅ Bon
<nav aria-label="Navigation principale">
  <a href="/">Accueil</a>
  <a href="/search">Recherche</a>
</nav>

// Skip link
<a href="#main" className="skip-link">Aller au contenu principal</a>
```

### 5. Modales

```jsx
// ✅ Bon
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Titre de la modal</h2>
  {/* Contenu */}
</div>
```

### 6. Messages d'erreur

```jsx
// ✅ Bon
<div role="alert" aria-live="assertive">
  {error && <p>{error}</p>}
</div>
```

## Correction des violations

### Violations courantes et solutions

1. **Contraste insuffisant**
   - Solution : Augmenter le contraste des couleurs (minimum 4.5:1)

2. **Images sans alt**
   - Solution : Ajouter des attributs `alt` descriptifs

3. **Boutons sans nom**
   - Solution : Ajouter `aria-label` ou texte visible

4. **Labels manquants**
   - Solution : Associer les labels aux inputs via `for` et `id`

5. **Focus non visible**
   - Solution : Ajouter des styles CSS pour `:focus`

## Intégration CI/CD

### GitHub Actions

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run accessibility tests
        run: |
          cd frontend
          npm run cypress:run -- --spec "cypress/e2e/accessibility.cy.js"
```

## Rapports d'accessibilité

Les rapports sont générés automatiquement par Cypress :
- Screenshots des violations dans `cypress/screenshots/`
- Vidéos dans `cypress/videos/`
- Logs détaillés dans la console

## Outils complémentaires

### Tests manuels recommandés

1. **Navigation au clavier uniquement**
   - Tester toute l'application avec Tab, Enter, Espace, Flèches

2. **Lecteur d'écran**
   - Tester avec NVDA (Windows), VoiceOver (macOS/iOS), JAWS

3. **Zoom**
   - Tester avec zoom à 200% et 400%

4. **Contraste élevé**
   - Tester avec le mode contraste élevé activé

## Métriques

- **Score d'accessibilité** : Nombre de violations détectées
- **Taux de conformité** : % de pages conformes WCAG 2.1 AA
- **Temps de correction** : Temps moyen pour corriger les violations

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

