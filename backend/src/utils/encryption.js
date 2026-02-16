const CryptoJS = require('crypto-js');
const config = require('../config');

/**
 * Encrypt sensitive data (OAuth tokens, API keys)
 */
const encrypt = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, config.encryption.key).toString();
};

/**
 * Decrypt sensitive data
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, config.encryption.key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
  encrypt,
  decrypt,
};
