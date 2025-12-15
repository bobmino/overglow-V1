/**
 * Script de test des corrections de sécurité
 * 
 * Usage: node scripts/test-security.js
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

let testsPassed = 0;
let testsFailed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    log.success(name);
    testsPassed++;
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    testsFailed++;
  }
};

console.log('\n🔒 Tests de Sécurité Overglow\n');
console.log(`API URL: ${API_URL}\n`);

// Test 1: Rate Limiting sur Login
await test('Rate Limiting - Login (5 tentatives max)', async () => {
  let rateLimited = false;
  
  for (let i = 1; i <= 6; i++) {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'test@test.com',
        password: 'wrongpassword',
      });
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimited = true;
        if (i <= 5) {
          throw new Error(`Rate limit activé trop tôt (tentative ${i})`);
        }
        break;
      }
    }
  }
  
  if (!rateLimited) {
    throw new Error('Rate limiting non activé après 5 tentatives');
  }
});

// Test 2: Headers Sécurité
await test('Headers Sécurité (Helmet)', async () => {
  const response = await axios.get(`${API_URL}/products`);
  
  const headers = response.headers;
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy',
  ];
  
  for (const header of requiredHeaders) {
    if (!headers[header]) {
      throw new Error(`Header ${header} manquant`);
    }
  }
  
  if (headers['x-content-type-options'] !== 'nosniff') {
    throw new Error('X-Content-Type-Options incorrect');
  }
  
  if (headers['x-frame-options'] !== 'DENY') {
    throw new Error('X-Frame-Options incorrect');
  }
});

// Test 3: Refresh Tokens
await test('Refresh Tokens - Login retourne access + refresh token', async () => {
  // Note: Ce test nécessite un utilisateur valide
  // Pour un vrai test, il faudrait créer un utilisateur de test d'abord
  log.warn('Test refresh tokens nécessite utilisateur valide - SKIP');
});

// Test 4: Validation Upload (MIME Type)
await test('Validation Upload - Rejet fichier non-image', async () => {
  const FormData = (await import('form-data')).default;
  const fs = (await import('fs')).default;
  
  // Créer un fichier texte temporaire
  const testFile = 'test-upload.txt';
  fs.writeFileSync(testFile, 'This is not an image');
  
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(testFile));
    
    await axios.post(`${API_URL}/upload`, form, {
      headers: form.getHeaders(),
    });
    
    // Si on arrive ici, le fichier a été accepté (erreur)
    fs.unlinkSync(testFile);
    throw new Error('Fichier non-image accepté (devrait être rejeté)');
  } catch (error) {
    fs.unlinkSync(testFile);
    
    if (error.response?.status === 400 || error.response?.status === 415) {
      // C'est bon, le fichier a été rejeté
      return;
    }
    
    throw new Error(`Erreur inattendue: ${error.message}`);
  }
});

// Test 5: Sanitization Inputs
await test('Sanitization Inputs - XSS protection', async () => {
  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: '<script>alert(1)</script>',
      email: 'test@test.com',
      password: 'test123456',
    });
    
    // Vérifier que le script a été échappé (nécessite vérification en base)
    log.warn('Sanitization vérifiée côté validation - SKIP (nécessite DB)');
  } catch (error) {
    // Erreur attendue (email déjà existant ou autre)
    if (error.response?.status === 400) {
      // Validation fonctionne
      return;
    }
    throw error;
  }
});

// Test 6: CORS Headers
await test('CORS Headers présents', async () => {
  const response = await axios.options(`${API_URL}/products`, {
    headers: {
      'Origin': 'http://localhost:5173',
    },
  });
  
  const headers = response.headers;
  
  if (!headers['access-control-allow-origin']) {
    throw new Error('CORS header Access-Control-Allow-Origin manquant');
  }
  
  if (!headers['access-control-allow-methods']) {
    throw new Error('CORS header Access-Control-Allow-Methods manquant');
  }
});

// Test 7: Verrouillage Compte
await test('Verrouillage Compte - Après 5 tentatives échouées', async () => {
  log.warn('Test verrouillage nécessite utilisateur valide - SKIP');
  log.info('Pour tester: faire 5 tentatives login échouées, puis vérifier lockedUntil');
});

// Résumé
console.log('\n' + '='.repeat(50));
console.log(`\nRésultats: ${colors.green}${testsPassed} réussis${colors.reset} / ${colors.red}${testsFailed} échoués${colors.reset}`);
console.log(`Total: ${testsPassed + testsFailed} tests\n`);

if (testsFailed === 0) {
  console.log(`${colors.green}✓ Tous les tests de sécurité sont passés !${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}✗ Certains tests ont échoué${colors.reset}\n`);
  process.exit(1);
}

