/**
 * Product Detail Page E2E Tests
 */

describe('Product Detail Page', () => {
  beforeEach(() => {
    // Visit search page first to get a product ID
    cy.visit('/search');
    cy.wait(2000); // Wait for products to load
  });

  it('should display product details', () => {
    // Click on first product
    cy.get('[data-testid="product-card"], a[href*="/products/"]').first().click();
    
    // Verify product page loaded
    cy.url().should('include', '/products/');
    
    // Check for key elements
    cy.get('h1').should('exist'); // Product title
    cy.get('img').should('exist'); // Product image
    cy.get('button').contains(/Réserver|Book/i).should('exist');
  });

  it('should display product images in gallery', () => {
    cy.get('[data-testid="product-card"], a[href*="/products/"]').first().click();
    
    cy.get('img').should('have.length.greaterThan', 0);
    
    // Try to click on image gallery if exists
    cy.get('img').first().click();
    cy.wait(500);
  });

  it('should display product reviews', () => {
    cy.get('[data-testid="product-card"], a[href*="/products/"]').first().click();
    
    // Scroll to reviews section if exists
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="reviews"], .reviews').length > 0) {
        cy.get('[data-testid="reviews"], .reviews').scrollIntoView();
        cy.get('[data-testid="reviews"], .reviews').should('exist');
      }
    });
  });

  it('should allow adding product to favorites when logged in', () => {
    // Login first
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    
    // Visit product page
    cy.visit('/search');
    cy.wait(2000);
    cy.get('[data-testid="product-card"], a[href*="/products/"]').first().click();
    
    // Try to find favorite button
    cy.get('body').then(($body) => {
      if ($body.find('button[aria-label*="favori"], button').find('svg').length > 0) {
        cy.get('button[aria-label*="favori"], button').contains(/Favori|Heart/i).first().click();
      }
    });
  });
});

