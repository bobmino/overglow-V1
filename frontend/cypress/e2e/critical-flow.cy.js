/**
 * Critical User Flow E2E Tests
 * Tests the complete booking flow: login → search → product → booking → checkout → confirmation
 */

describe('Critical User Flow - Complete Booking Journey', () => {
  beforeEach(() => {
    // Visit homepage
    cy.visit('/');
  });

  it('should complete full booking flow: login → search → booking → checkout → confirmation', () => {
    // Step 1: Login
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    
    // Verify logged in (check for user menu or dashboard link)
    cy.get('a[href*="/dashboard"], button').contains(/Dashboard|Profil/i).should('exist');
    
    // Step 2: Search for products
    cy.searchProducts('Marrakech');
    
    // Verify search results loaded
    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('have.length.greaterThan', 0);
    
    // Step 3: Select a product
    cy.selectProduct(0);
    
    // Verify product detail page loaded
    cy.url().should('include', '/products/');
    cy.get('h1').should('exist'); // Product title
    
    // Step 4: Add to booking
    cy.addToBooking();
    
    // Verify booking page loaded
    cy.url().should('include', '/booking');
    cy.get('h1, h2').contains(/Réservation|Booking/i).should('exist');
    
    // Step 5: Continue to checkout
    cy.get('button').contains(/Continuer|Continue/i).click();
    
    // Step 6: Complete checkout with mock payment
    cy.completeCheckout('cash');
    
    // Step 7: Verify success page
    cy.url().should('include', '/booking-success');
    cy.get('h1, h2').contains(/Confirmé|Success|Réservation confirmée/i).should('exist');
    cy.get('button, a').contains(/Dashboard|Mes réservations/i).should('exist');
  });

  it('should handle search and product selection', () => {
    // Search without login
    cy.searchProducts('Casablanca');
    
    // Verify results
    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('have.length.greaterThan', 0);
    
    // Click on first product
    cy.selectProduct(0);
    
    // Verify product page
    cy.url().should('include', '/products/');
    cy.get('h1').should('exist');
    cy.get('button').contains(/Réserver|Book/i).should('exist');
  });

  it('should handle registration flow', () => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    cy.register(`Test User ${timestamp}`, testEmail, 'test123456');
    
    // Should redirect to home or dashboard
    cy.url().should('not.include', '/register');
    
    // Should be logged in
    cy.get('a[href*="/dashboard"], button').contains(/Dashboard|Profil/i).should('exist');
  });
});

