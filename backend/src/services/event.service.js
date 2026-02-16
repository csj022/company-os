const { query } = require('../config/database');
const logger = require('../utils/logger');

class EventService {
  /**
   * Log an event
   */
  async logEvent({
    organizationId,
    eventType,
    eventSource,
    actorType = null,
    actorId = null,
    resourceType = null,
    resourceId = null,
    metadata = {},
  }) {
    try {
      const result = await query(
        `INSERT INTO events (
          organization_id, event_type, event_source, actor_type, actor_id,
          resource_type, resource_id, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, event_type, event_source, created_at`,
        [
          organizationId,
          eventType,
          eventSource,
          actorType,
          actorId,
          resourceType,
          resourceId,
          JSON.stringify(metadata),
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to log event:', error);
      // Don't throw - event logging should not break main flow
    }
  }
  
  /**
   * Get events for organization
   */
  async getEvents(organizationId, filters = {}) {
    const {
      eventType,
      eventSource,
      limit = 100,
      offset = 0,
    } = filters;
    
    let queryText = `
      SELECT id, organization_id, event_type, event_source, actor_type,
             actor_id, resource_type, resource_id, metadata, created_at
      FROM events
      WHERE organization_id = $1
    `;
    
    const params = [organizationId];
    let paramCount = 1;
    
    if (eventType) {
      paramCount++;
      queryText += ` AND event_type = $${paramCount}`;
      params.push(eventType);
    }
    
    if (eventSource) {
      paramCount++;
      queryText += ` AND event_source = $${paramCount}`;
      params.push(eventSource);
    }
    
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    return result.rows;
  }
  
  /**
   * Record a metric
   */
  async recordMetric({
    organizationId,
    metricType,
    value,
    unit = null,
    dimensions = {},
  }) {
    try {
      const result = await query(
        `INSERT INTO metrics (organization_id, metric_type, value, unit, dimensions)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, metric_type, value, recorded_at`,
        [organizationId, metricType, value, unit, JSON.stringify(dimensions)]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to record metric:', error);
    }
  }
  
  /**
   * Get metrics
   */
  async getMetrics(organizationId, metricType, timeRange = '24h') {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
    };
    
    const interval = intervals[timeRange] || '24 hours';
    
    const result = await query(
      `SELECT id, metric_type, value, unit, dimensions, recorded_at
       FROM metrics
       WHERE organization_id = $1
         AND metric_type = $2
         AND recorded_at >= NOW() - INTERVAL '${interval}'
       ORDER BY recorded_at DESC`,
      [organizationId, metricType]
    );
    
    return result.rows;
  }
}

module.exports = new EventService();
