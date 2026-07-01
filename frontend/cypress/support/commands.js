// ***********************************************
// Custom Cypress commands — Overglow E2E
// ***********************************************

const getApiUrl = () => Cypress.env('apiUrl') || 'http://127.0.0.1:5001';

/**
 * Connexion via API (fiable) + injection session localStorage
 */
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${getApiUrl()}/api/auth/login`,
    body: { email, password },
    failOnStatusCode: true,
  }).then(({ body }) => {
    const userData = { ...body, refreshToken: body.refreshToken || null };
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('userInfo', JSON.stringify(userData));
    });
    cy.reload();
  });
});

/**
 * Inscription utilisateur via l'UI
 */
Cypress.Commands.add('register', (name, email, password) => {
  cy.visit('/register');
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.get('input[name="confirmPassword"]').type(password, { log: false });
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 20000 }).should('not.include', '/register');
});

/**
 * Recherche de produits via paramètre URL (filtre ville)
 */
Cypress.Commands.add('searchProducts', (query) => {
  cy.intercept('GET', '**/api/products*').as('getProducts');
  cy.visit(`/search?city=${encodeURIComponent(query)}`);
  cy.wait('@getProducts', { timeout: 30000 });
  cy.get('[data-testid="product-card"]', { timeout: 30000 })
    .should('have.length.greaterThan', 0);
});

/**
 * Sélection d'un produit dans les résultats
 */
Cypress.Commands.add('selectProduct', (index = 0) => {
  cy.get('[data-testid="product-card"], a[href*="/products/"]')
    .eq(index)
    .click({ force: true });
  cy.url({ timeout: 20000 }).should('include', '/products/');
});

/**
 * Sélection date + créneau + navigation vers /booking
 */
Cypress.Commands.add('addToBooking', () => {
  cy.get('h1', { timeout: 20000 }).should('exist');

  cy.get('[data-testid="date-picker-trigger"]:visible').first().click();
  cy.get('[data-testid="date-picker-calendar"]:visible')
    .find('button:not(:disabled)')
    .filter((_, el) => /^\d{1,2}$/.test(el.innerText.trim()))
    .first()
    .click();

  cy.get('[data-testid="time-slot-picker-trigger"]:visible').first().click();
  cy.get('[data-testid="time-slot-picker-dropdown"]:visible')
    .should('be.visible')
    .find('button')
    .contains(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)
    .click();

  cy.get('[data-testid="time-slot-picker-trigger"]:visible')
    .first()
    .should('contain', ':');

  cy.get('[data-testid="book-now-button"]:visible')
    .first()
    .should('not.be.disabled')
    .click();
  cy.url({ timeout: 20000 }).should('include', '/booking');
});

/**
 * Continuer depuis la page booking vers checkout
 */
Cypress.Commands.add('continueToCheckout', () => {
  cy.url().should('include', '/booking');
  cy.contains('h1', /Confirmer les détails/i).should('be.visible');
  cy.get('.animate-pulse', { timeout: 20000 }).should('not.exist');

  const { email } = Cypress.env('testUser');
  cy.get('#traveler-first-name').then(($input) => {
    if (!$input.val()) cy.get('#traveler-first-name').type('Admin');
  });
  cy.get('#traveler-email').then(($input) => {
    if (!$input.val()) cy.get('#traveler-email').type(email);
  });

  cy.get('[data-testid="continue-to-checkout"]', { timeout: 20000 })
    .scrollIntoView()
    .should('not.be.disabled')
    .click();
  cy.url({ timeout: 20000 }).should('include', '/checkout');
});

/**
 * Finaliser le checkout avec paiement espèces (mock)
 */
Cypress.Commands.add('completeCheckout', (paymentMethod = 'cash') => {
  cy.url().should('include', '/checkout');

  if (paymentMethod === 'cash') {
    cy.contains('button:visible', 'Espèces').click();
    cy.contains('button:visible', /Confirmer — Paiement sur Place/i).click();
  } else if (paymentMethod === 'card') {
    cy.contains('button:visible', /Carte|Stripe/i).first().click();
    cy.contains('button:visible', /Payer/i).click();
  }

  cy.url({ timeout: 30000 }).should('include', '/booking-success');
});

/**
 * Vérifie que l'utilisateur est connecté (session + bouton profil header)
 */
Cypress.Commands.add('assertLoggedIn', () => {
  cy.window().then((win) => {
    const raw = win.localStorage.getItem('userInfo');
    expect(raw, 'userInfo dans localStorage').to.exist;
    const user = JSON.parse(raw);
    expect(user.token, 'token JWT présent').to.exist;
    cy.contains('button:visible', user.name).should('exist');
  });
});

/**
 * Attendre une réponse API interceptée
 */
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, url).as('apiCall');
  cy.wait('@apiCall');
});
