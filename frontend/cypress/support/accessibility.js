/**
 * Accessibility Testing Support
 * Import axe-core for automated accessibility testing
 */

import 'cypress-axe';

// Configure axe-core
Cypress.Commands.add('configureAxe', () => {
  cy.injectAxe();
  cy.configureAxe({
    rules: {
      // WCAG 2.1 Level A and AA rules
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'button-name': { enabled: true },
      'image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'page-has-heading-one': { enabled: true },
      'region': { enabled: true },
    },
  });
});

