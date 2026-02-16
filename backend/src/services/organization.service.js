const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class OrganizationService {
  /**
   * Create a new organization
   */
  async create({ name, slug, userId }) {
    return await transaction(async (client) => {
      // Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug)
         VALUES ($1, $2)
         RETURNING id, name, slug, created_at`,
        [name, slug]
      );
      
      const organization = orgResult.rows[0];
      
      // Add creator as owner
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [organization.id, userId, 'owner']
      );
      
      logger.info(`Organization created: ${name} by user ${userId}`);
      return organization;
    });
  }
  
  /**
   * Get organization by ID
   */
  async getById(organizationId) {
    const result = await query(
      `SELECT id, name, slug, logo_url, settings, created_at, updated_at
       FROM organizations
       WHERE id = $1`,
      [organizationId]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Get organization by slug
   */
  async getBySlug(slug) {
    const result = await query(
      `SELECT id, name, slug, logo_url, settings, created_at, updated_at
       FROM organizations
       WHERE slug = $1`,
      [slug]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Update organization
   */
  async update(organizationId, updates) {
    const { name, logo_url, settings } = updates;
    
    const result = await query(
      `UPDATE organizations
       SET name = COALESCE($2, name),
           logo_url = COALESCE($3, logo_url),
           settings = COALESCE($4, settings),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, slug, logo_url, settings, updated_at`,
      [organizationId, name, logo_url, settings ? JSON.stringify(settings) : null]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get organization members
   */
  async getMembers(organizationId) {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.last_seen_at,
              om.role, om.joined_at
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at ASC`,
      [organizationId]
    );
    
    return result.rows;
  }
  
  /**
   * Add member to organization
   */
  async addMember(organizationId, userId, role = 'member') {
    const result = await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, user_id) DO UPDATE
       SET role = EXCLUDED.role
       RETURNING id, organization_id, user_id, role, joined_at`,
      [organizationId, userId, role]
    );
    
    logger.info(`User ${userId} added to organization ${organizationId} as ${role}`);
    return result.rows[0];
  }
  
  /**
   * Update member role
   */
  async updateMemberRole(organizationId, userId, role) {
    const result = await query(
      `UPDATE organization_members
       SET role = $3
       WHERE organization_id = $1 AND user_id = $2
       RETURNING id, organization_id, user_id, role`,
      [organizationId, userId, role]
    );
    
    return result.rows[0];
  }
  
  /**
   * Remove member from organization
   */
  async removeMember(organizationId, userId) {
    await query(
      `DELETE FROM organization_members
       WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );
    
    logger.info(`User ${userId} removed from organization ${organizationId}`);
  }
  
  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId) {
    const result = await query(
      `SELECT o.id, o.name, o.slug, o.logo_url, om.role, om.joined_at
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1
       ORDER BY om.joined_at DESC`,
      [userId]
    );
    
    return result.rows;
  }
}

module.exports = new OrganizationService();
