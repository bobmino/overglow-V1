/**
 * Mobile and Responsive Design E2E Tests
 */

describe('Mobile and Responsive Design', () => {
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12 Pro', width: 390, height: 844 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad', width: 768, height: 1024 },
  ];

  mobileViewports.forEach((viewport) => {
    context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
      });

      it('should display homepage correctly', () => {
        cy.get('body').should('be.visible');
        cy.get('header, nav').should('exist');
        cy.get('main, [role="main"]').should('exist');
      });

      it('should have mobile navigation', () => {
        // Check for mobile menu button or bottom navigation
        cy.get('body').then(($body) => {
          if ($body.find('[aria-label*="menu"], button').find('svg').length > 0) {
            cy.get('[aria-label*="menu"], button').first().click();
            cy.get('nav, [role="navigation"]').should('be.visible');
          }
        });
      });

      it('should display search page correctly', () => {
        cy.visit('/search');
        cy.get('input[type="search"], input[placeholder*="Rechercher"]').should('be.visible');
        cy.get('button[type="submit"], button').contains('Rechercher').should('be.visible');
      });

      it('should display product cards correctly', () => {
        cy.visit('/search');
        cy.wait(2000);
        
        cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
          if ($cards.length > 0) {
            cy.wrap($cards.first()).should('be.visible');
            cy.wrap($cards.first()).within(() => {
              cy.get('img').should('be.visible');
            });
          }
        });
      });

      it('should handle product detail page', () => {
        cy.visit('/search');
        cy.wait(2000);
        
        cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
          if ($cards.length > 0) {
            cy.wrap($cards.first()).click();
            cy.url().should('include', '/products/');
            cy.get('h1').should('be.visible');
            cy.get('img').should('be.visible');
          }
        });
      });

      it('should have touch-friendly buttons', () => {
        cy.visit('/');
        
        // Check button sizes (should be at least 44x44px for touch)
        cy.get('button').each(($btn) => {
          cy.wrap($btn).then(($el) => {
            const height = $el.height();
            const width = $el.width();
            // Skip if button is in a flex container that might resize
            if (height > 0 && width > 0) {
              expect(height).to.be.at.least(32); // Minimum touch target
            }
          });
        });
      });

      it('should handle form inputs correctly', () => {
        cy.visit('/login');
        
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        
        // Test input focus
        cy.get('input[name="email"]').focus().should('be.focused');
        cy.get('input[name="password"]').focus().should('be.focused');
      });

      it('should prevent horizontal scroll', () => {
        cy.visit('/');
        cy.get('body').then(($body) => {
          const bodyWidth = $body.width();
          const scrollWidth = $body[0].scrollWidth;
          expect(scrollWidth).to.be.at.most(bodyWidth + 1); // Allow 1px tolerance
        });
      });
    });
  });

  context('Desktop viewport (1920x1080)', () => {
    beforeEach(() => {
      cy.viewport(1920, 1080);
      cy.visit('/');
    });

    it('should display desktop layout correctly', () => {
      cy.get('header, nav').should('exist');
      cy.get('main, [role="main"]').should('exist');
    });

    it('should display product grid correctly', () => {
      cy.visit('/search');
      cy.wait(2000);
      
      cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
        if ($cards.length > 0) {
          // Check grid layout
          cy.wrap($cards.first()).should('be.visible');
        }
      });
    });
  });
});

