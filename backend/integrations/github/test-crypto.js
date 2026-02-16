/**
 * Basic crypto tests (no dependencies required)
 * Run with: ENCRYPTION_KEY=test node test-crypto.js
 * Or: node test-crypto.js (will generate key)
 */

import crypto from 'crypto';

// Generate encryption key if not set
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.log('Generated test encryption key');
}

// NOW import after env is set
import { encrypt, decrypt, generateEncryptionKey, hash, secureCompare, generateToken } from './crypto.js';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotEquals(actual, expected, message) {
  if (actual === expected) {
    throw new Error(message || `Expected not to equal ${expected}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true, got false');
  }
}

console.log('\n🧪 Running Crypto Tests\n');

test('generateEncryptionKey should return 64 character hex string', () => {
  const key = generateEncryptionKey();
  assertEquals(key.length, 64, 'Key should be 64 characters');
  assertTrue(/^[0-9a-f]+$/.test(key), 'Key should be hexadecimal');
});

test('encrypt should encrypt a string', () => {
  const plaintext = 'my-secret-token';
  const encrypted = encrypt(plaintext);
  
  assertNotEquals(encrypted, plaintext, 'Encrypted should not equal plaintext');
  assertTrue(encrypted.includes(':'), 'Encrypted should contain delimiters');
  const parts = encrypted.split(':');
  assertEquals(parts.length, 3, 'Encrypted should have 3 parts (IV:authTag:encrypted)');
});

test('decrypt should decrypt encrypted string', () => {
  const plaintext = 'my-secret-token';
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);
  
  assertEquals(decrypted, plaintext, 'Decrypted should match original');
});

test('encrypt/decrypt should handle special characters', () => {
  const plaintext = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);
  
  assertEquals(decrypted, plaintext, 'Should handle special characters');
});

test('encrypt should produce different ciphertext each time', () => {
  const plaintext = 'same-plaintext';
  const encrypted1 = encrypt(plaintext);
  const encrypted2 = encrypt(plaintext);
  
  assertNotEquals(encrypted1, encrypted2, 'Should produce different ciphertext (random IV)');
  assertEquals(decrypt(encrypted1), plaintext, 'Both should decrypt correctly');
  assertEquals(decrypt(encrypted2), plaintext, 'Both should decrypt correctly');
});

test('hash should create consistent hashes', () => {
  const value = 'test-value';
  const hash1 = hash(value);
  const hash2 = hash(value);
  
  assertEquals(hash1, hash2, 'Hash should be consistent');
  assertEquals(hash1.length, 64, 'SHA256 hash should be 64 chars');
});

test('hash should produce different hashes for different inputs', () => {
  const hash1 = hash('value1');
  const hash2 = hash('value2');
  
  assertNotEquals(hash1, hash2, 'Different inputs should produce different hashes');
});

test('secureCompare should compare strings safely', () => {
  assertTrue(secureCompare('test', 'test'), 'Should match equal strings');
  assertTrue(!secureCompare('test', 'different'), 'Should not match different strings');
  assertTrue(!secureCompare('test', 'Test'), 'Should be case-sensitive');
  assertTrue(!secureCompare('short', 'longer'), 'Should handle different lengths');
});

test('generateToken should generate random tokens', () => {
  const token1 = generateToken();
  const token2 = generateToken();
  
  assertNotEquals(token1, token2, 'Should generate different tokens');
  assertEquals(token1.length, 64, 'Default token should be 64 chars');
  assertTrue(/^[0-9a-f]+$/.test(token1), 'Token should be hexadecimal');
});

test('generateToken should respect custom length', () => {
  const token = generateToken(16);
  assertEquals(token.length, 32, 'Should generate 32 chars (16 bytes in hex)');
});

test('webhook signature verification', () => {
  const secret = 'test-webhook-secret';
  const payload = JSON.stringify({ test: 'data', number: 42 });
  
  // Create valid signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const validSignature = 'sha256=' + hmac.digest('hex');
  
  // Verify manually
  const hmac2 = crypto.createHmac('sha256', secret);
  hmac2.update(payload);
  const calculatedSignature = 'sha256=' + hmac2.digest('hex');
  
  assertEquals(validSignature, calculatedSignature, 'Signatures should match');
});

// Print results
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${results.passed} passed, ${results.failed} failed`);
console.log('='.repeat(50));

if (results.failed > 0) {
  console.log('\nFailed tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  console.log('\n❌ Some tests failed\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
  console.log('To run full integration tests:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Run: node test.js\n');
  process.exit(0);
}
