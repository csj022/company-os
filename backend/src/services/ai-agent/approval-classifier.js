/**
 * Approval Classifier
 * Determines if AI-generated code changes need human approval
 */

class ApprovalClassifier {
  constructor(config = {}) {
    this.rules = config.rules || this.getDefaultRules();
  }

  /**
   * Classify a change and determine if it needs approval
   */
  classify(change) {
    const {
      type,
      code,
      filePath,
      securityIssues = [],
      testResults = {},
      description = ''
    } = change;

    const classification = {
      needsApproval: false,
      reason: [],
      riskLevel: 'low', // low, medium, high, critical
      autoApproved: false,
      category: this._categorize(type, filePath, code)
    };

    // Apply rules in order of priority
    for (const rule of this.rules) {
      const result = rule.check(change);
      if (result.matches) {
        classification.needsApproval = result.needsApproval;
        classification.reason.push(result.reason);
        classification.riskLevel = this._maxRiskLevel(
          classification.riskLevel,
          result.riskLevel
        );

        // If a critical rule matches, stop checking
        if (result.riskLevel === 'critical') {
          break;
        }
      }
    }

    // Auto-approve if no approval needed
    if (!classification.needsApproval) {
      classification.autoApproved = true;
      classification.reason.push('Meets auto-approval criteria');
    }

    return classification;
  }

  /**
   * Categorize the change type
   */
  _categorize(type, filePath, code) {
    if (type === 'test' || filePath?.includes('.test.') || filePath?.includes('.spec.')) {
      return 'test';
    }
    
    if (type === 'fix' && code.split('\n').length <= 50) {
      return 'small-fix';
    }
    
    if (type === 'refactor') {
      return 'refactor';
    }
    
    if (filePath?.includes('migration') || filePath?.includes('schema')) {
      return 'database';
    }
    
    if (filePath?.includes('config') || filePath?.match(/\.(json|yaml|yml|env)$/)) {
      return 'config';
    }
    
    if (code?.includes('router.') || code?.includes('app.') || code?.includes('express.')) {
      return 'api';
    }
    
    return 'feature';
  }

  /**
   * Get max risk level between two levels
   */
  _maxRiskLevel(level1, level2) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    return levels[Math.max(index1, index2)];
  }

  /**
   * Default classification rules
   */
  getDefaultRules() {
    return [
      // CRITICAL RULES - Always need approval
      {
        name: 'security-issues',
        check: (change) => {
          const hasSecurityIssues = change.securityIssues && change.securityIssues.length > 0;
          return {
            matches: hasSecurityIssues,
            needsApproval: true,
            riskLevel: 'critical',
            reason: `Security issues detected: ${change.securityIssues?.length || 0} issue(s)`
          };
        }
      },
      {
        name: 'failed-tests',
        check: (change) => {
          const testsFailed = change.testResults?.passed === false;
          return {
            matches: testsFailed,
            needsApproval: true,
            riskLevel: 'critical',
            reason: 'Tests failed - requires review'
          };
        }
      },
      {
        name: 'hardcoded-secrets',
        check: (change) => {
          const hasSecrets = /(?:password|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/.test(
            change.code?.toLowerCase() || ''
          );
          return {
            matches: hasSecrets,
            needsApproval: true,
            riskLevel: 'critical',
            reason: 'Potential hardcoded secrets detected'
          };
        }
      },

      // HIGH RISK RULES
      {
        name: 'large-change',
        check: (change) => {
          const lineCount = (change.code || '').split('\n').length;
          const isLarge = lineCount > 50;
          return {
            matches: isLarge,
            needsApproval: true,
            riskLevel: 'high',
            reason: `Large change (${lineCount} lines) - requires review`
          };
        }
      },
      {
        name: 'database-migration',
        check: (change) => {
          const isDbChange = 
            change.filePath?.includes('migration') ||
            change.filePath?.includes('schema') ||
            change.code?.includes('ALTER TABLE') ||
            change.code?.includes('DROP TABLE') ||
            change.code?.includes('CREATE TABLE');
          return {
            matches: isDbChange,
            needsApproval: true,
            riskLevel: 'high',
            reason: 'Database schema change - requires review'
          };
        }
      },
      {
        name: 'api-change',
        check: (change) => {
          const isApiChange = 
            change.filePath?.includes('routes') ||
            change.filePath?.includes('api') ||
            change.code?.includes('router.') ||
            change.code?.includes('app.get') ||
            change.code?.includes('app.post');
          return {
            matches: isApiChange,
            needsApproval: true,
            riskLevel: 'high',
            reason: 'API endpoint change - requires review'
          };
        }
      },
      {
        name: 'breaking-change',
        check: (change) => {
          const hasBreakingChange = 
            change.description?.toLowerCase().includes('breaking') ||
            change.code?.includes('BREAKING CHANGE') ||
            change.code?.includes('@deprecated');
          return {
            matches: hasBreakingChange,
            needsApproval: true,
            riskLevel: 'high',
            reason: 'Breaking change detected - requires review'
          };
        }
      },
      {
        name: 'dependency-change',
        check: (change) => {
          const isDependencyChange = 
            change.filePath?.includes('package.json') ||
            change.filePath?.includes('package-lock.json') ||
            change.filePath?.includes('yarn.lock');
          return {
            matches: isDependencyChange,
            needsApproval: true,
            riskLevel: 'medium',
            reason: 'Dependency change - requires review'
          };
        }
      },
      {
        name: 'config-change',
        check: (change) => {
          const isConfigChange = 
            change.filePath?.includes('config') ||
            change.filePath?.match(/\.(env|yaml|yml)$/);
          return {
            matches: isConfigChange,
            needsApproval: true,
            riskLevel: 'medium',
            reason: 'Configuration change - requires review'
          };
        }
      },

      // MEDIUM RISK RULES
      {
        name: 'new-feature',
        check: (change) => {
          const isNewFeature = change.type === 'generate' || change.type === 'feature';
          return {
            matches: isNewFeature,
            needsApproval: true,
            riskLevel: 'medium',
            reason: 'New feature - requires review'
          };
        }
      },

      // AUTO-APPROVE RULES (checked last)
      {
        name: 'test-addition',
        check: (change) => {
          const isTest = 
            change.type === 'test' ||
            change.filePath?.includes('.test.') ||
            change.filePath?.includes('.spec.');
          return {
            matches: isTest,
            needsApproval: false,
            riskLevel: 'low',
            reason: 'Test addition - auto-approved'
          };
        }
      },
      {
        name: 'small-bug-fix',
        check: (change) => {
          const lineCount = (change.code || '').split('\n').length;
          const isSmallFix = change.type === 'fix' && lineCount <= 50;
          return {
            matches: isSmallFix,
            needsApproval: false,
            riskLevel: 'low',
            reason: `Small bug fix (${lineCount} lines) - auto-approved`
          };
        }
      },
      {
        name: 'formatting',
        check: (change) => {
          const isFormatting = 
            change.type === 'format' ||
            change.description?.toLowerCase().includes('format') ||
            change.description?.toLowerCase().includes('lint');
          return {
            matches: isFormatting,
            needsApproval: false,
            riskLevel: 'low',
            reason: 'Formatting/linting only - auto-approved'
          };
        }
      },
      {
        name: 'documentation',
        check: (change) => {
          const isDocs = 
            change.filePath?.match(/\.(md|txt|rst)$/) ||
            change.code?.startsWith('/**') ||
            change.code?.startsWith('/*') ||
            change.type === 'docs';
          return {
            matches: isDocs,
            needsApproval: false,
            riskLevel: 'low',
            reason: 'Documentation update - auto-approved'
          };
        }
      },
      {
        name: 'comments',
        check: (change) => {
          const isComments = 
            change.type === 'comments' ||
            /^[\s/\*]*\/\//.test(change.code || '');
          return {
            matches: isComments,
            needsApproval: false,
            riskLevel: 'low',
            reason: 'Comment addition - auto-approved'
          };
        }
      }
    ];
  }

  /**
   * Add custom rule
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Get summary of classification rules
   */
  getRulesSummary() {
    return this.rules.map(rule => ({
      name: rule.name,
      description: rule.check.toString().substring(0, 100) + '...'
    }));
  }
}

module.exports = ApprovalClassifier;
