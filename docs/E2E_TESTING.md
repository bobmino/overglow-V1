# Tests E2E avec Cypress

## Vue d'ensemble

Les tests E2E (End-to-End) sont configurés avec Cypress pour valider les flux critiques de l'application.

## Installation

Les dépendances sont déjà installées. Si besoin :

```bash
cd frontend
npm install
```

## Configuration

### Variables d'environnement

Créer `cypress.env.json` dans `frontend/` :

```json
{
  "testUser": {
    "email": "test@example.com",
    "password": "test123456"
  },
  "apiUrl": "http://localhost:5001"
}
```

### Configuration Cypress

Le fichier `cypress.config.js` configure :
- Base URL : `http://localhost:5173` (dev) ou URL de production
- Viewport : 1280x720
- Timeouts : 10 secondes
- Vidéo et screenshots activés

## Exécution des tests

### Mode interactif (recommandé pour développement)

```bash
cd frontend
npm run cypress:open
```

Ouvre l'interface Cypress pour exécuter les tests visuellement.

### Mode headless (CI/CD)

```bash
cd frontend
npm run cypress:run
```

Exécute tous les tests en mode headless.

### Tests spécifiques

```bash
# Test du flux critique
npx cypress run --spec "cypress/e2e/critical-flow.cy.js"

# Test d'authentification
npx cypress run --spec "cypress/e2e/authentication.cy.js"
```

## Tests disponibles

### 1. Flux critique complet (`critical-flow.cy.js`)

Teste le parcours utilisateur complet :
- ✅ Login
- ✅ Recherche de produits
- ✅ Sélection d'un produit
- ✅ Ajout au panier/booking
- ✅ Checkout
- ✅ Confirmation de réservation

### 2. Recherche et filtres (`search-and-filter.cy.js`)

Teste les fonctionnalités de recherche :
- ✅ Recherche par texte
- ✅ Filtrage par catégorie
- ✅ Filtrage par prix
- ✅ Filtrage par ville

### 3. Authentification (`authentication.cy.js`)

Teste les pages d'authentification :
- ✅ Affichage login
- ✅ Affichage register
- ✅ Validation des formulaires
- ✅ Navigation entre pages

### 4. Détail produit (`product-detail.cy.js`)

Teste la page produit :
- ✅ Affichage des détails
- ✅ Galerie d'images
- ✅ Avis clients
- ✅ Ajout aux favoris

## Commandes personnalisées

### `cy.login(email, password)`

Connecte un utilisateur :

```javascript
cy.login('user@example.com', 'password123');
```

### `cy.register(name, email, password)`

Enregistre un nouvel utilisateur :

```javascript
cy.register('John Doe', 'john@example.com', 'password123');
```

### `cy.searchProducts(query)`

Recherche des produits :

```javascript
cy.searchProducts('Marrakech');
```

### `cy.selectProduct(index)`

Sélectionne un produit dans les résultats :

```javascript
cy.selectProduct(0); // Premier produit
```

### `cy.addToBooking()`

Ajoute un produit au booking (sélectionne date et heure) :

```javascript
cy.addToBooking();
```

### `cy.completeCheckout(paymentMethod)`

Complète le checkout :

```javascript
cy.completeCheckout('cash'); // ou 'card'
```

## Bonnes pratiques

### 1. Attendre les chargements

```javascript
cy.wait(1000); // Attendre le chargement
cy.get('[data-testid="element"]').should('exist'); // Attendre un élément
```

### 2. Utiliser les data-testid

Ajouter `data-testid` aux éléments importants :

```jsx
<button data-testid="book-button">Réserver</button>
```

### 3. Éviter les sélecteurs fragiles

❌ Mauvais :
```javascript
cy.get('.btn-primary').click();
```

✅ Bon :
```javascript
cy.get('[data-testid="submit-button"]').click();
cy.get('button').contains('Réserver').click();
```

### 4. Gérer les erreurs réseau

```javascript
cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as('getProducts');
cy.wait('@getProducts');
```

## Tests en production

Pour tester sur l'URL de production :

```bash
# Modifier cypress.config.js
baseUrl: 'https://overglow-v1-3jqp.vercel.app'

# Ou utiliser une variable d'environnement
CYPRESS_BASE_URL=https://overglow-v1-3jqp.vercel.app npm run cypress:run
```

## Intégration CI/CD

### GitHub Actions

Créer `.github/workflows/cypress.yml` :

```yaml
name: Cypress Tests

on: [push, pull_request]

jobs:
  cypress-run:
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
      - name: Run Cypress tests
        run: |
          cd frontend
          npm run cypress:run
```

### Vercel

Ajouter dans `vercel.json` :

```json
{
  "buildCommand": "cd frontend && npm run build",
  "devCommand": "cd frontend && npm run dev",
  "testCommand": "cd frontend && npm run cypress:run"
}
```

## Dépannage

### Tests qui échouent

1. Vérifier que le serveur de dev est lancé (`npm run dev`)
2. Vérifier que l'API backend est accessible
3. Vérifier les credentials dans `cypress.env.json`
4. Augmenter les timeouts si nécessaire

### Erreurs de sélecteurs

1. Utiliser `cy.get('body').then()` pour vérifier l'existence
2. Ajouter des `data-testid` aux éléments critiques
3. Utiliser des sélecteurs plus spécifiques

### Vidéos et screenshots

Les vidéos sont sauvegardées dans `cypress/videos/`
Les screenshots sont sauvegardés dans `cypress/screenshots/`

## Prochaines étapes

- [ ] Ajouter des tests pour le dashboard opérateur
- [ ] Ajouter des tests pour le dashboard admin
- [ ] Ajouter des tests de performance
- [ ] Ajouter des tests d'accessibilité avec Cypress
- [ ] Configurer les tests sur plusieurs navigateurs

## Ressources

- [Documentation Cypress](https://docs.cypress.io/)
- [Best Practices Cypress](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)

