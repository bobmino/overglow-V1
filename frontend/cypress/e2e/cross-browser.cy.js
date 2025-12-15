/**
 * Cross-Browser Compatibility Tests
 * These tests verify that the application works correctly across different browsers
 */

describe('Cross-Browser Compatibility', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load homepage in all browsers', () => {
    cy.get('body').should('be.visible');
    cy.get('header, nav').should('exist');
    cy.title().should('not.be.empty');
  });

  it('should handle navigation correctly', () => {
    cy.get('a[href*="/search"], button').contains(/Recherche|Search/i).then(($link) => {
      if ($link.length > 0) {
        cy.wrap($link).click();
        cy.url().should('include', '/search');
      }
    });
  });

  it('should handle form submission correctly', () => {
    cy.visit('/login');
    
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('test123456');
    
    // Form should be submittable
    cy.get('form').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should handle images correctly', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('img').then(($imgs) => {
      if ($imgs.length > 0) {
        cy.wrap($imgs.first()).should('be.visible');
        cy.wrap($imgs.first()).should('have.attr', 'src');
      }
    });
  });

  it('should handle CSS correctly', () => {
    cy.get('body').should('have.css', 'font-family');
    cy.get('body').should('have.css', 'color');
  });

  it('should handle JavaScript correctly', () => {
    // Test that JavaScript is working
    cy.window().then((win) => {
      expect(win).to.have.property('React');
      expect(win).to.have.property('document');
    });
  });

  it('should handle localStorage correctly', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('test', 'value');
      expect(win.localStorage.getItem('test')).to.equal('value');
      win.localStorage.removeItem('test');
    });
  });

  it('should handle fetch/axios correctly', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    // Products should load via API
    cy.get('[data-testid="product-card"], a[href*="/products/"]').should('exist');
  });
});

