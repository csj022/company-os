/**
 * AI Audit Log
 * Tracks all AI actions, changes, and decisions for accountability
 */

const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class AuditLog {
  constructor(config = {}) {
    this.logFile = config.logFile || path.join(process.cwd(), 'logs', 'ai-audit.log');
    this.entries = [];
    this.maxEntriesInMemory = config.maxEntriesInMemory || 1000;
  }

  /**
   * Log an AI action
   */
  async log(entry) {
    const logEntry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Add to in-memory array
    this.entries.push(logEntry);
    
    // Trim if too many entries
    if (this.entries.length > this.maxEntriesInMemory) {
      this.entries = this.entries.slice(-this.maxEntriesInMemory);
    }

    // Write to file
    try {
      await this._writeToFile(logEntry);
    } catch (error) {
      logger.error('Failed to write audit log:', error);
    }

    return logEntry;
  }

  /**
   * Log code generation
   */
  async logCodeGeneration({ taskId, agentName, input, output, cost, approved }) {
    return this.log({
      type: 'code_generation',
      taskId,
      agentName,
      input: {
        description: input.description,
        language: input.language,
        filePath: input.filePath
      },
      output: {
        lineCount: output.code?.split('\n').length || 0,
        tokensUsed: output.tokensUsed,
        cost: output.cost
      },
      cost,
      approved,
      needsApproval: output.needsApproval
    });
  }

  /**
   * Log code review
   */
  async logCodeReview({ taskId, agentName, filePath, review, cost }) {
    return this.log({
      type: 'code_review',
      taskId,
      agentName,
      filePath,
      review: {
        rating: review.rating,
        issuesCount: review.issues?.length || 0,
        securityConcerns: review.securityConcerns?.length || 0
      },
      cost
    });
  }

  /**
   * Log code commit
   */
  async logCommit({ taskId, agentName, branch, files, commitSha, prNumber }) {
    return this.log({
      type: 'commit',
      taskId,
      agentName,
      branch,
      files,
      commitSha,
      prNumber
    });
  }

  /**
   * Log approval decision
   */
  async logApproval({ taskId, approved, approvedBy, reason, timestamp }) {
    return this.log({
      type: 'approval',
      taskId,
      approved,
      approvedBy,
      reason,
      approvalTimestamp: timestamp || new Date().toISOString()
    });
  }

  /**
   * Log rollback
   */
  async logRollback({ taskId, reason, branch, commitSha }) {
    return this.log({
      type: 'rollback',
      taskId,
      reason,
      branch,
      commitSha
    });
  }

  /**
   * Log error
   */
  async logError({ taskId, agentName, error, context }) {
    return this.log({
      type: 'error',
      taskId,
      agentName,
      error: {
        message: error.message || error,
        stack: error.stack
      },
      context
    });
  }

  /**
   * Log safety check
   */
  async logSafetyCheck({ taskId, checks, passed, issues }) {
    return this.log({
      type: 'safety_check',
      taskId,
      checks,
      passed,
      issuesFound: issues?.length || 0,
      issues: issues || []
    });
  }

  /**
   * Get entries by type
   */
  getByType(type, limit = 100) {
    return this.entries
      .filter(e => e.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get entries by task ID
   */
  getByTaskId(taskId) {
    return this.entries
      .filter(e => e.taskId === taskId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get entries by date range
   */
  getByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.entries
      .filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate >= start && entryDate <= end;
      })
      .reverse();
  }

  /**
   * Get all entries
   */
  getAll(limit = 100) {
    return this.entries.slice(-limit).reverse();
  }

  /**
   * Get statistics
   */
  getStats(startDate = null, endDate = null) {
    let entries = this.entries;
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      entries = entries.filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate >= start && entryDate <= end;
      });
    }

    const stats = {
      total: entries.length,
      byType: {},
      totalCost: 0,
      approvedActions: 0,
      rejectedActions: 0,
      autoApproved: 0,
      errors: 0
    };

    for (const entry of entries) {
      // Count by type
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;

      // Sum costs
      if (entry.cost) {
        stats.totalCost += entry.cost;
      }

      // Count approvals
      if (entry.type === 'approval') {
        if (entry.approved) {
          stats.approvedActions++;
        } else {
          stats.rejectedActions++;
        }
      }

      // Count auto-approvals
      if (entry.approved && !entry.needsApproval) {
        stats.autoApproved++;
      }

      // Count errors
      if (entry.type === 'error') {
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Generate report
   */
  async generateReport({ startDate, endDate, format = 'json' }) {
    const stats = this.getStats(startDate, endDate);
    const entries = this.getByDateRange(startDate, endDate);

    const report = {
      generated: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate
      },
      stats,
      recentEntries: entries.slice(0, 50)
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'markdown') {
      return this._formatMarkdownReport(report);
    } else {
      return report;
    }
  }

  /**
   * Format report as Markdown
   */
  _formatMarkdownReport(report) {
    return `# AI Agent Audit Report

**Generated:** ${report.generated}
**Period:** ${report.period.start} to ${report.period.end}

## Statistics

- **Total Actions:** ${report.stats.total}
- **Total Cost:** $${report.stats.totalCost.toFixed(4)}
- **Approved Actions:** ${report.stats.approvedActions}
- **Rejected Actions:** ${report.stats.rejectedActions}
- **Auto-Approved Actions:** ${report.stats.autoApproved}
- **Errors:** ${report.stats.errors}

## Actions by Type

${Object.entries(report.stats.byType)
  .map(([type, count]) => `- **${type}:** ${count}`)
  .join('\n')}

## Recent Actions

${report.recentEntries.slice(0, 10).map(entry => `
### ${entry.type} - ${entry.timestamp}
- **Task ID:** ${entry.taskId || 'N/A'}
- **Agent:** ${entry.agentName || 'N/A'}
${entry.approved !== undefined ? `- **Approved:** ${entry.approved}` : ''}
`).join('\n')}
`;
  }

  /**
   * Clear old entries
   */
  async clearOldEntries(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.entries = this.entries.filter(e => {
      return new Date(e.timestamp) >= cutoffDate;
    });

    logger.info(`Cleared audit entries older than ${daysToKeep} days`);
  }

  /**
   * Write entry to file
   */
  async _writeToFile(entry) {
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      
      const line = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, line, 'utf-8');
    } catch (error) {
      console.error('Failed to write to audit log file:', error);
    }
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Load entries from file
   */
  async loadFromFile() {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      this.entries = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (error) {
            return null;
          }
        })
        .filter(entry => entry !== null);

      logger.info(`Loaded ${this.entries.length} audit entries from file`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to load audit log file:', error);
      }
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  AuditLog,
  getInstance: async (config) => {
    if (!instance) {
      instance = new AuditLog(config);
      await instance.loadFromFile();
    }
    return instance;
  }
};
