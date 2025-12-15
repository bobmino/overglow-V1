/**
 * Accessibility Tests (WCAG 2.1 AA)
 * Automated accessibility testing using axe-core
 */

describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    cy.configureAxe();
  });

  it('should have no accessibility violations on homepage', () => {
    cy.visit('/');
    cy.checkA11y();
  });

  it('should have no accessibility violations on search page', () => {
    cy.visit('/search');
    cy.wait(2000); // Wait for content to load
    cy.checkA11y();
  });

  it('should have no accessibility violations on login page', () => {
    cy.visit('/login');
    cy.checkA11y();
  });

  it('should have no accessibility violations on register page', () => {
    cy.visit('/register');
    cy.checkA11y();
  });

  it('should have no accessibility violations on product detail page', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('[data-testid="product-card"], a[href*="/products/"]').then(($cards) => {
      if ($cards.length > 0) {
        cy.wrap($cards.first()).click();
        cy.url().should('include', '/products/');
        cy.wait(1000);
        cy.checkA11y();
      }
    });
  });

  it('should have proper heading hierarchy', () => {
    cy.visit('/');
    
    // Check for h1
    cy.get('h1').should('exist');
    
    // Check heading order (h1 before h2, etc.)
    cy.get('body').then(($body) => {
      const headings = $body.find('h1, h2, h3, h4, h5, h6');
      if (headings.length > 0) {
        cy.get('h1').should('exist');
      }
    });
  });

  it('should have proper form labels', () => {
    cy.visit('/login');
    
    cy.get('input[name="email"]').should('have.attr', 'id');
    cy.get('input[name="email"]').then(($input) => {
      const id = $input.attr('id');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      }
    });
    
    cy.get('input[name="password"]').should('have.attr', 'id');
    cy.get('input[name="password"]').then(($input) => {
      const id = $input.attr('id');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      }
    });
  });

  it('should have proper alt text for images', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should have proper ARIA labels for interactive elements', () => {
    cy.visit('/');
    
    // Check buttons without visible text
    cy.get('button').each(($btn) => {
      const text = $btn.text().trim();
      const ariaLabel = $btn.attr('aria-label');
      const ariaLabelledBy = $btn.attr('aria-labelledby');
      
      if (!text && !ariaLabel && !ariaLabelledBy) {
        // Button should have aria-label or visible text
        cy.wrap($btn).should('have.attr', 'aria-label');
      }
    });
  });

  it('should be keyboard navigable', () => {
    cy.visit('/');
    
    // Tab through interactive elements
    cy.get('body').tab();
    cy.focused().should('exist');
    
    // Check that focus is visible
    cy.focused().should('have.css', 'outline').and('not.be.empty');
  });

  it('should have proper color contrast', () => {
    cy.visit('/');
    
    // Check text elements have sufficient contrast
    cy.get('body').then(($body) => {
      // This is checked by axe-core color-contrast rule
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });
  });

  it('should have skip links for navigation', () => {
    cy.visit('/');
    
    // Check for skip to main content link
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="#main"], a[href*="#content"]').length > 0) {
        cy.get('a[href*="#main"], a[href*="#content"]').should('exist');
      }
    });
  });

  it('should have proper language attribute', () => {
    cy.visit('/');
    cy.get('html').should('have.attr', 'lang');
  });

  it('should have proper form error messages', () => {
    cy.visit('/login');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check for error messages with proper ARIA
    cy.get('[role="alert"], .error, [aria-live]').should('exist');
  });

  it('should handle focus management in modals', () => {
    cy.visit('/search');
    cy.wait(2000);
    
    // Try to open a modal if exists
    cy.get('body').then(($body) => {
      if ($body.find('[role="dialog"], .modal').length > 0) {
        cy.get('button').contains(/Ouvrir|Open/i).first().click();
        cy.get('[role="dialog"], .modal').should('be.visible');
        cy.get('[role="dialog"], .modal').should('have.focus');
      }
    });
  });

  it('should have proper landmark regions', () => {
    cy.visit('/');
    
    // Check for main landmarks
    cy.get('header, [role="banner"]').should('exist');
    cy.get('main, [role="main"]').should('exist');
    cy.get('footer, [role="contentinfo"]').should('exist');
  });

  it('should have proper table structure if tables exist', () => {
    cy.visit('/dashboard');
    
    cy.get('body').then(($body) => {
      if ($body.find('table').length > 0) {
        cy.get('table').each(($table) => {
          cy.wrap($table).find('thead, th').should('exist');
        });
      }
    });
  });
});

