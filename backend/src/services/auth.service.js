const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user
   */
  async register({ email, name, password, organizationId }) {
    try {
      // Check if user exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check if this is the first user (becomes admin)
      const userCount = await query('SELECT COUNT(*) FROM users');
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;
      const role = isFirstUser ? 'admin' : 'member';
      
      // Create user
      const result = await query(
        `INSERT INTO users (email, name, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, created_at`,
        [email, name, hashedPassword, role]
      );
      
      if (isFirstUser) {
        logger.info(`First user created as admin: ${email}`);
      }
      
      const user = result.rows[0];
      
      // If organization provided, add user to it
      if (organizationId) {
        await query(
          `INSERT INTO organization_members (organization_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [organizationId, user.id, 'member']
        );
      }
      
      logger.info(`User registered: ${email}`);
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Login user
   */
  async login({ email, password }) {
    try {
      // Find user
      const result = await query(
        `SELECT u.id, u.email, u.name, u.role, u.password_hash,
                om.organization_id, om.role as org_role
         FROM users u
         LEFT JOIN organization_members om ON u.id = om.user_id
         WHERE u.email = $1
         LIMIT 1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.org_role || user.role,
        organizationId: user.organization_id,
      });
      
      const refreshToken = generateRefreshToken({
        userId: user.id,
      });
      
      // Update last seen
      await query(
        'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
        [user.id]
      );
      
      logger.info(`User logged in: ${email}`);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.org_role || user.role,
          organizationId: user.organization_id,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at,
              om.organization_id, om.role as org_role
       FROM users u
       LEFT JOIN organization_members om ON u.id = om.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const { name, avatar_url, settings } = updates;
    
    const result = await query(
      `UPDATE users
       SET name = COALESCE($2, name),
           avatar_url = COALESCE($3, avatar_url),
           settings = COALESCE($4, settings),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, avatar_url, role`,
      [userId, name, avatar_url, settings ? JSON.stringify(settings) : null]
    );
    
    return result.rows[0];
  }
}

module.exports = new AuthService();
