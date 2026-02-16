/**
 * Basic tests for GitHub integration
 * Run with: node test.js
 */

import { encrypt, decrypt, generateEncryptionKey, hash, secureCompare } from './crypto.js';
import { verifyGitHubSignature } from './webhooks.js';
import { GitHubClient } from './client.js';

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

console.log('\n🧪 Running GitHub Integration Tests\n');

// Crypto tests
console.log('Encryption & Crypto Tests:');

test('generateEncryptionKey should return 64 character hex string', () => {
  const key = generateEncryptionKey();
  assertEquals(key.length, 64, 'Key should be 64 characters');
  assertTrue(/^[0-9a-f]+$/.test(key), 'Key should be hexadecimal');
});

test('encrypt should encrypt a string', () => {
  process.env.ENCRYPTION_KEY = generateEncryptionKey();
  const plaintext = 'my-secret-token';
  const encrypted = encrypt(plaintext);
  
  assertNotEquals(encrypted, plaintext, 'Encrypted should not equal plaintext');
  assertTrue(encrypted.includes(':'), 'Encrypted should contain delimiters');
  const parts = encrypted.split(':');
  assertEquals(parts.length, 3, 'Encrypted should have 3 parts (IV:authTag:encrypted)');
});

test('decrypt should decrypt encrypted string', () => {
  process.env.ENCRYPTION_KEY = generateEncryptionKey();
  const plaintext = 'my-secret-token';
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);
  
  assertEquals(decrypted, plaintext, 'Decrypted should match original');
});

test('encrypt/decrypt should handle special characters', () => {
  process.env.ENCRYPTION_KEY = generateEncryptionKey();
  const plaintext = 'token-with-special-chars!@#$%^&*()';
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);
  
  assertEquals(decrypted, plaintext, 'Should handle special characters');
});

test('hash should create consistent hashes', () => {
  const value = 'test-value';
  const hash1 = hash(value);
  const hash2 = hash(value);
  
  assertEquals(hash1, hash2, 'Hash should be consistent');
  assertEquals(hash1.length, 64, 'SHA256 hash should be 64 chars');
});

test('secureCompare should compare strings safely', () => {
  assertTrue(secureCompare('test', 'test'), 'Should match equal strings');
  assertTrue(!secureCompare('test', 'different'), 'Should not match different strings');
  assertTrue(!secureCompare('test', 'Test'), 'Should be case-sensitive');
});

// Webhook verification tests
console.log('\nWebhook Tests:');

test('verifyGitHubSignature should verify valid signature', () => {
  const crypto = require('crypto');
  const secret = 'test-secret';
  const payload = { test: 'data' };
  const payloadString = JSON.stringify(payload);
  
  // Create valid signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  const signature = 'sha256=' + hmac.digest('hex');
  
  const isValid = verifyGitHubSignature(payloadString, signature, secret);
  assertTrue(isValid, 'Should verify valid signature');
});

test('verifyGitHubSignature should reject invalid signature', () => {
  const secret = 'test-secret';
  const payload = JSON.stringify({ test: 'data' });
  const invalidSignature = 'sha256=invalid';
  
  const isValid = verifyGitHubSignature(payload, invalidSignature, secret);
  assertTrue(!isValid, 'Should reject invalid signature');
});

test('verifyGitHubSignature should reject missing signature', () => {
  const payload = JSON.stringify({ test: 'data' });
  const isValid = verifyGitHubSignature(payload, null, 'secret');
  assertTrue(!isValid, 'Should reject missing signature');
});

// Client tests
console.log('\nClient Tests:');

test('GitHubClient should initialize', () => {
  const client = new GitHubClient('test-token');
  assertTrue(client.octokit !== undefined, 'Should have octokit instance');
  assertTrue(client.graphqlClient !== undefined, 'Should have graphql client');
});

test('GitHubClient should handle rate limit error', async () => {
  const client = new GitHubClient('test-token');
  
  try {
    await client.makeRequest(() => {
      const error = new Error('rate limit exceeded');
      error.status = 403;
      throw error;
    });
    throw new Error('Should have thrown RateLimitError');
  } catch (error) {
    assertEquals(error.name, 'RateLimitError', 'Should throw RateLimitError');
  }
});

test('GitHubClient should handle authentication error', async () => {
  const client = new GitHubClient('test-token');
  
  try {
    await client.makeRequest(() => {
      const error = new Error('unauthorized');
      error.status = 401;
      throw error;
    });
    throw new Error('Should have thrown AuthenticationError');
  } catch (error) {
    assertEquals(error.name, 'AuthenticationError', 'Should throw AuthenticationError');
  }
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
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
