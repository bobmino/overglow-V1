/**
 * Search and Filter E2E Tests
 */

describe('Search and Filter Functionality', () => {
  beforeEach(() => {
    cy.visit('/search');
  });

  it('should search for products', () => {
    cy.get('input[type="search"], input[placeholder*="Rechercher"]').type('Marrakech');
    cy.get('button[type="submit"], button').contains('Rechercher').click();
    
    cy.wait(1000);
    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('have.length.greaterThan', 0);
  });

  it('should filter by category', () => {
    cy.get('button, select').contains(/Catégorie|Category/i).click();
    cy.get('button, option').contains(/Visite|Tour/i).click();
    
    cy.wait(1000);
    cy.get('[data-testid="product-card"]').should('exist');
  });

  it('should filter by price range', () => {
    cy.get('input[type="range"], input[name*="price"]').first().then(($input) => {
      cy.wrap($input).invoke('val', 50).trigger('change');
    });
    
    cy.wait(1000);
    cy.get('[data-testid="product-card"]').should('exist');
  });

  it('should filter by city', () => {
    cy.get('select[name*="city"], button').contains(/Ville|City/i).click();
    cy.get('option, button').contains('Marrakech').click();
    
    cy.wait(1000);
    cy.get('[data-testid="product-card"]').should('exist');
  });
});

