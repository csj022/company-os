const { query } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

class IntegrationService {
  /**
   * Create or update integration
   */
  async upsert(organizationId, service, credentials, metadata = {}) {
    const encryptedCredentials = encrypt(JSON.stringify(credentials));
    
    const result = await query(
      `INSERT INTO integrations (organization_id, service, credentials_encrypted, metadata, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (organization_id, service)
       DO UPDATE SET
         credentials_encrypted = EXCLUDED.credentials_encrypted,
         metadata = EXCLUDED.metadata,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id, organization_id, service, status, metadata, created_at, updated_at`,
      [organizationId, service, encryptedCredentials, JSON.stringify(metadata)]
    );
    
    logger.info(`Integration ${service} configured for organization ${organizationId}`);
    return result.rows[0];
  }
  
  /**
   * Get integration
   */
  async get(organizationId, service) {
    const result = await query(
      `SELECT id, organization_id, service, credentials_encrypted, metadata,
              status, last_sync_at, created_at, updated_at
       FROM integrations
       WHERE organization_id = $1 AND service = $2`,
      [organizationId, service]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const integration = result.rows[0];
    
    // Decrypt credentials
    integration.credentials = JSON.parse(decrypt(integration.credentials_encrypted));
    delete integration.credentials_encrypted;
    
    return integration;
  }
  
  /**
   * Get all integrations for organization
   */
  async getAll(organizationId) {
    const result = await query(
      `SELECT id, organization_id, service, metadata, status,
              last_sync_at, created_at, updated_at
       FROM integrations
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId]
    );
    
    return result.rows;
  }
  
  /**
   * Update integration status
   */
  async updateStatus(integrationId, status) {
    const result = await query(
      `UPDATE integrations
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, service, status`,
      [integrationId, status]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update last sync timestamp
   */
  async updateLastSync(integrationId) {
    await query(
      `UPDATE integrations
       SET last_sync_at = NOW()
       WHERE id = $1`,
      [integrationId]
    );
  }
  
  /**
   * Delete integration
   */
  async delete(organizationId, service) {
    await query(
      `DELETE FROM integrations
       WHERE organization_id = $1 AND service = $2`,
      [organizationId, service]
    );
    
    logger.info(`Integration ${service} deleted for organization ${organizationId}`);
  }
  
  /**
   * Store webhook configuration
   */
  async createWebhook(integrationId, service, eventType, webhookId, secret) {
    const result = await query(
      `INSERT INTO webhooks (integration_id, service, event_type, webhook_id, secret, active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, integration_id, service, event_type, active, created_at`,
      [integrationId, service, eventType, webhookId, secret]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get webhooks for integration
   */
  async getWebhooks(integrationId) {
    const result = await query(
      `SELECT id, integration_id, service, event_type, webhook_id, active, created_at
       FROM webhooks
       WHERE integration_id = $1`,
      [integrationId]
    );
    
    return result.rows;
  }
}

module.exports = new IntegrationService();
