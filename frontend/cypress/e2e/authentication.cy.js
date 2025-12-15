/**
 * Authentication E2E Tests
 */

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.get('h1, h2').contains(/Connexion|Login/i).should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should display register page', () => {
    cy.visit('/register');
    cy.get('h1, h2').contains(/Créer|Register|Inscription/i).should('exist');
    cy.get('input[name="name"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show validation errors on empty form submission', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.get('[role="alert"], .error, .text-red').should('exist');
  });

  it('should navigate to register from login', () => {
    cy.visit('/login');
    cy.get('a[href*="/register"]').click();
    cy.url().should('include', '/register');
  });

  it('should navigate to login from register', () => {
    cy.visit('/register');
    cy.get('a[href*="/login"]').click();
    cy.url().should('include', '/login');
  });
});

