/**
 * Security Checking Tools
 * Tools for identifying security vulnerabilities in code
 */

/**
 * Check code for security issues
 */
async function checkSecurity({ code, language = 'javascript' }) {
  const issues = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // Check for common JavaScript security issues
    issues.push(...checkJavaScriptSecurity(code));
  }

  // Check for general security patterns
  issues.push(...checkGeneralSecurity(code));

  return {
    passed: issues.length === 0,
    issues: issues.map(issue => ({
      severity: issue.severity,
      type: issue.type,
      message: issue.message,
      line: issue.line,
      recommendation: issue.recommendation
    }))
  };
}

/**
 * Check JavaScript-specific security issues
 */
function checkJavaScriptSecurity(code) {
  const issues = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for eval()
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        severity: 'high',
        type: 'dangerous-function',
        message: 'Use of eval() detected',
        line: lineNum,
        recommendation: 'Avoid eval(). Use JSON.parse() or safer alternatives.'
      });
    }

    // Check for Function constructor
    if (/new\s+Function\s*\(/.test(line)) {
      issues.push({
        severity: 'high',
        type: 'dangerous-function',
        message: 'Use of Function constructor detected',
        line: lineNum,
        recommendation: 'Avoid Function constructor. Use regular functions instead.'
      });
    }

    // Check for innerHTML with user input
    if (/innerHTML\s*=/.test(line) && !/innerHTML\s*=\s*['"`]/.test(line)) {
      issues.push({
        severity: 'medium',
        type: 'xss-risk',
        message: 'Potential XSS vulnerability with innerHTML',
        line: lineNum,
        recommendation: 'Use textContent or sanitize HTML before using innerHTML.'
      });
    }

    // Check for document.write
    if (/document\.write\s*\(/.test(line)) {
      issues.push({
        severity: 'medium',
        type: 'dangerous-function',
        message: 'Use of document.write() detected',
        line: lineNum,
        recommendation: 'Avoid document.write(). Use DOM manipulation instead.'
      });
    }

    // Check for hardcoded secrets/credentials
    if (/(?:password|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/.test(line.toLowerCase())) {
      issues.push({
        severity: 'critical',
        type: 'hardcoded-secret',
        message: 'Potential hardcoded secret detected',
        line: lineNum,
        recommendation: 'Use environment variables or a secret management system.'
      });
    }

    // Check for SQL injection risk
    if (/(?:query|execute)\s*\([^)]*\+[^)]*\)/.test(line)) {
      issues.push({
        severity: 'high',
        type: 'sql-injection',
        message: 'Potential SQL injection vulnerability',
        line: lineNum,
        recommendation: 'Use parameterized queries or an ORM.'
      });
    }

    // Check for weak crypto
    if (/(?:md5|sha1)\s*\(/.test(line.toLowerCase())) {
      issues.push({
        severity: 'medium',
        type: 'weak-crypto',
        message: 'Weak cryptographic algorithm detected',
        line: lineNum,
        recommendation: 'Use SHA-256 or stronger algorithms.'
      });
    }

    // Check for insecure random
    if (/Math\.random\s*\(/.test(line)) {
      issues.push({
        severity: 'low',
        type: 'weak-random',
        message: 'Math.random() is not cryptographically secure',
        line: lineNum,
        recommendation: 'Use crypto.randomBytes() for security-sensitive operations.'
      });
    }

    // Check for unsafe regex (ReDoS)
    if (/new\s+RegExp\s*\([^)]*\+/.test(line) || /\.match\s*\([^)]*\+/.test(line)) {
      issues.push({
        severity: 'medium',
        type: 'redos-risk',
        message: 'Potential ReDoS vulnerability with dynamic regex',
        line: lineNum,
        recommendation: 'Avoid user input in regex patterns or validate carefully.'
      });
    }

    // Check for path traversal
    if (/(?:readFile|writeFile|unlink)\s*\([^)]*\+/.test(line)) {
      issues.push({
        severity: 'high',
        type: 'path-traversal',
        message: 'Potential path traversal vulnerability',
        line: lineNum,
        recommendation: 'Validate and sanitize file paths. Use path.resolve() and check against allowed directories.'
      });
    }

    // Check for prototype pollution
    if (/\[.*?(__proto__|constructor|prototype)\]/.test(line)) {
      issues.push({
        severity: 'high',
        type: 'prototype-pollution',
        message: 'Potential prototype pollution vulnerability',
        line: lineNum,
        recommendation: 'Avoid direct property assignment with user-controlled keys.'
      });
    }
  });

  return issues;
}

/**
 * Check general security patterns
 */
function checkGeneralSecurity(code) {
  const issues = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for TODO/FIXME security notes
    if (/(?:TODO|FIXME).*(?:security|vulnerable|unsafe|hack)/i.test(line)) {
      issues.push({
        severity: 'low',
        type: 'security-todo',
        message: 'Security-related TODO/FIXME found',
        line: lineNum,
        recommendation: 'Address security TODOs before deployment.'
      });
    }

    // Check for disabled security features
    if (/(?:disable|skip|ignore).*(?:security|sanitize|validate|escape)/i.test(line)) {
      issues.push({
        severity: 'medium',
        type: 'disabled-security',
        message: 'Disabled security feature detected',
        line: lineNum,
        recommendation: 'Re-enable security features or document why they are disabled.'
      });
    }

    // Check for sensitive data in logs
    if (/console\.log\([^)]*(?:password|token|secret|key)/i.test(line)) {
      issues.push({
        severity: 'medium',
        type: 'sensitive-data-leak',
        message: 'Potential sensitive data in logs',
        line: lineNum,
        recommendation: 'Remove sensitive data from logs or use proper log sanitization.'
      });
    }
  });

  return issues;
}

/**
 * Check for dependency vulnerabilities
 */
async function checkDependencies({ packageJsonPath = 'package.json' }) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    const { stdout } = await execPromise('npm audit --json', {
      timeout: 30000
    });

    const auditData = JSON.parse(stdout);
    const vulnerabilities = [];

    if (auditData.vulnerabilities) {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
        vulnerabilities.push({
          package: name,
          severity: vuln.severity,
          title: vuln.title || vuln.via?.[0]?.title,
          url: vuln.url || vuln.via?.[0]?.url,
          range: vuln.range
        });
      }
    }

    return {
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length
      }
    };
  } catch (error) {
    // If npm audit fails, it might mean vulnerabilities exist
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        // Process vulnerabilities even if audit exits with error code
        const vulnerabilities = [];
        
        if (auditData.vulnerabilities) {
          for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
            vulnerabilities.push({
              package: name,
              severity: vuln.severity,
              title: vuln.title || vuln.via?.[0]?.title,
              url: vuln.url || vuln.via?.[0]?.url,
              range: vuln.range
            });
          }
        }

        return {
          passed: false,
          vulnerabilities,
          summary: {
            total: vulnerabilities.length,
            critical: vulnerabilities.filter(v => v.severity === 'critical').length,
            high: vulnerabilities.filter(v => v.severity === 'high').length,
            moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
            low: vulnerabilities.filter(v => v.severity === 'low').length
          }
        };
      } catch (parseError) {
        throw new Error(`Failed to parse npm audit results: ${parseError.message}`);
      }
    }
    
    throw new Error(`Failed to check dependencies: ${error.message}`);
  }
}

/**
 * Scan for secrets in code
 */
function scanForSecrets({ code }) {
  const secrets = [];
  const lines = code.split('\n');

  // Common secret patterns
  const patterns = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
    { name: 'GitHub Token', regex: /ghp_[0-9a-zA-Z]{36}/, severity: 'critical' },
    { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, severity: 'critical' },
    { name: 'Generic API Key', regex: /api[_-]?key[_-]?[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, severity: 'high' },
    { name: 'Generic Secret', regex: /secret[_-]?[:=]\s*['"][a-zA-Z0-9]{20,}['"]/, severity: 'high' },
    { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, severity: 'high' }
  ];

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      if (pattern.regex.test(line)) {
        secrets.push({
          type: pattern.name,
          severity: pattern.severity,
          line: index + 1,
          snippet: line.trim().substring(0, 100) + '...'
        });
      }
    });
  });

  return {
    found: secrets.length > 0,
    count: secrets.length,
    secrets
  };
}

module.exports = {
  checkSecurity,
  checkDependencies,
  scanForSecrets
};
