/**
 * [TASK-2] Unit tests for payment amount validation (no external deps).
 * Run: npm run test:payment-amount
 */
import {
  amountsMatch,
  normalizeMoney,
  validatePaymentAmount,
  AMOUNT_TOLERANCE,
} from '../backend/utils/paymentAmount.js';
import { isTrustedPaypalCertUrl } from '../backend/services/paypalWebhookService.js';

let passed = 0;
let failed = 0;

const assert = (name, condition) => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}`);
  }
};

console.log('paymentAmount tests');
assert('exact match', amountsMatch(100, 100) === true);
assert('within tolerance', amountsMatch(100, 100.01) === true);
assert('outside tolerance', amountsMatch(100, 100.02) === false);
assert('invalid expected', amountsMatch('abc', 10) === false);
assert('normalizeMoney rounds', normalizeMoney(10.456) === 10.46);
assert('normalizeMoney rejects negative', normalizeMoney(-1) === null);

const ok = validatePaymentAmount({ expected: 150, received: 150 });
assert('validate ok', ok.ok === true && ok.expected === 150);

const mismatch = validatePaymentAmount({ expected: 150, received: 0.01 });
assert('validate mismatch', mismatch.ok === false && mismatch.reason.includes('match'));

const missingRequired = validatePaymentAmount({
  expected: 150,
  received: null,
  requireReceived: true,
});
assert('require received', missingRequired.ok === false);

const optionalMissing = validatePaymentAmount({ expected: 150, received: undefined });
assert('optional received uses booking amount', optionalMissing.ok === true);

assert('tolerance constant', AMOUNT_TOLERANCE === 0.01);

console.log('\nisTrustedPaypalCertUrl tests');
assert('sandbox cert ok', isTrustedPaypalCertUrl('https://api.sandbox.paypal.com/cert.pem') === true);
assert('live cert ok', isTrustedPaypalCertUrl('https://api.paypal.com/cert.pem') === true);
assert('evil host blocked', isTrustedPaypalCertUrl('https://evil.com/cert.pem') === false);
assert('http blocked', isTrustedPaypalCertUrl('http://api.paypal.com/cert.pem') === false);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
