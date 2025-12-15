// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Login helper command
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  // Wait for redirect after login
  cy.url().should('not.include', '/login');
});

/**
 * Register helper command
 */
Cypress.Commands.add('register', (name, email, password) => {
  cy.visit('/register');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="confirmPassword"]').type(password);
  cy.get('button[type="submit"]').click();
  // Wait for redirect after registration
  cy.url().should('not.include', '/register');
});

/**
 * Search for products
 */
Cypress.Commands.add('searchProducts', (query) => {
  cy.visit('/search');
  cy.get('input[type="search"], input[placeholder*="Rechercher"]').type(query);
  cy.get('button[type="submit"], button').contains('Rechercher').click();
  cy.wait(1000); // Wait for results to load
});

/**
 * Select product from search results
 */
Cypress.Commands.add('selectProduct', (index = 0) => {
  cy.get('[data-testid="product-card"], a[href*="/products/"]').eq(index).click();
  cy.url().should('include', '/products/');
});

/**
 * Add product to booking
 */
Cypress.Commands.add('addToBooking', () => {
  // Select a date
  cy.get('input[type="date"], button').contains('Sélectionner').first().click();
  cy.wait(500);
  
  // Select a time slot
  cy.get('button').contains(/^\d{1,2}:\d{2}/).first().click();
  cy.wait(500);
  
  // Click "Réserver maintenant" or "Book Now"
  cy.get('button').contains(/Réserver|Book/i).click();
});

/**
 * Complete checkout with mock payment
 */
Cypress.Commands.add('completeCheckout', (paymentMethod = 'cash') => {
  cy.url().should('include', '/checkout');
  
  // Select payment method
  if (paymentMethod === 'cash') {
    cy.get('input[value="cash"], button').contains('Espèces').click();
  } else if (paymentMethod === 'card') {
    cy.get('input[value="card"], button').contains('Carte').click();
  }
  
  // Submit booking
  cy.get('button[type="submit"], button').contains(/Confirmer|Payer/i).click();
  
  // Wait for success page
  cy.url().should('include', '/booking-success');
});

/**
 * Wait for API response
 */
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, url).as('apiCall');
  cy.wait('@apiCall');
});

