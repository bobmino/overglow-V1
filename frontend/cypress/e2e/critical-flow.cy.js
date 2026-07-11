/**
 * Critical User Flow E2E Tests
 * Flux complet : login → recherche → produit → booking → checkout → confirmation
 *
 * Prérequis : backend :5001 + frontend :5173 + catalogue Agadir + user admin@overglow.com
 */

describe('Critical User Flow - Complete Booking Journey', () => {
  it('should complete full booking flow: login → search → booking → checkout → confirmation', () => {
    const { email, password } = Cypress.env('testUser');

    // Étape 1 : Connexion
    cy.login(email, password);
    cy.assertLoggedIn();

    // Étape 2 : Recherche de produits (Agadir — données réelles en BDD)
    cy.searchProducts('Agadir');
    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('have.length.greaterThan', 0);

    // Étape 3 : Sélection d'un produit
    cy.selectProduct(0);
    cy.url().should('include', '/products/');
    cy.get('h1').should('exist');

    // Étape 4 : Réservation (date + créneau)
    cy.addToBooking();
    cy.get('h1').contains(/Confirmer les détails|Booking|Réservation/i).should('exist');

    // Étape 5 : Continuer vers le checkout
    cy.continueToCheckout();

    // Étape 6 : Paiement offline (espèces → PENDING_PAYMENT jusqu'à validation admin)
    cy.completeCheckout('cash');

    // Étape 7 : Page de succès
    cy.url().should('include', '/booking-success');
    cy.get('h1').contains(/Confirmé|Réservation Confirmée|Succès|Success/i).should('exist');
    cy.get('a, button').contains(/Voir mes réservations|Dashboard|réservations/i).should('exist');
  });

  it('should handle search and product selection', () => {
    cy.searchProducts('Agadir');

    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('have.length.greaterThan', 0);
    cy.selectProduct(0);

    cy.url().should('include', '/products/');
    cy.get('h1').should('exist');
    cy.get('[data-testid="date-picker-trigger"]').should('be.visible');
    cy.get('[data-testid="time-slot-picker-trigger"]').should('be.visible');
    cy.get('[data-testid="book-now-button"]').should('be.visible');
  });

  it('should handle registration flow', () => {
    const timestamp = Date.now();
    const testEmail = `e2e${timestamp}@example.com`;

    cy.register(`E2E User ${timestamp}`, testEmail, 'test123456');

    cy.url().should('not.include', '/register');
    cy.assertLoggedIn();
  });
});
