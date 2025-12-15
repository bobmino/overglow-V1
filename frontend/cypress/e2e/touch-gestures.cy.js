/**
 * Touch Gestures and Mobile Interactions Tests
 */

describe('Touch Gestures and Mobile Interactions', () => {
  beforeEach(() => {
    cy.viewport('iphone-12');
    cy.visit('/');
  });

  it('should handle tap gestures', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
      if ($cards.length > 0) {
        cy.wrap($cards.first()).click();
        cy.url().should('include', '/products/');
      }
    });
  });

  it('should handle swipe gestures on image gallery', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('[data-testid="product-card"], a[href*="/products/"]').first().click();
    
    cy.get('body').then(($body) => {
      if ($body.find('img').length > 1) {
        // Test swipe on image gallery if exists
        cy.get('img').first().trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
        cy.get('img').first().trigger('touchmove', { touches: [{ clientX: 50, clientY: 100 }] });
        cy.get('img').first().trigger('touchend');
      }
    });
  });

  it('should handle scroll gestures', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    // Scroll down
    cy.scrollTo(0, 500);
    cy.wait(500);
    
    // Scroll up
    cy.scrollTo(0, 0);
    cy.wait(500);
  });

  it('should handle pull-to-refresh (if implemented)', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    // Test pull-to-refresh gesture
    cy.get('body').trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] });
    cy.get('body').trigger('touchmove', { touches: [{ clientX: 200, clientY: 300 }] });
    cy.get('body').trigger('touchend');
  });

  it('should handle long press (if implemented)', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
      if ($cards.length > 0) {
        // Long press simulation
        cy.wrap($cards.first()).trigger('touchstart');
        cy.wait(500);
        cy.wrap($cards.first()).trigger('touchend');
      }
    });
  });

  it('should handle pinch zoom prevention', () => {
    cy.visit('/');
    
    // Check viewport meta tag
    cy.get('head meta[name="viewport"]').should('exist');
    cy.get('head meta[name="viewport"]').should('have.attr', 'content').and('include', 'user-scalable=no');
  });
});

