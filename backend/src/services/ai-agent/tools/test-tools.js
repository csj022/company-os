/**
 * Test Execution Tools
 * Tools for running and managing tests
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * Run tests
 */
async function runTests({ filePath = null, testPattern = null, framework = 'jest' }) {
  try {
    let command;
    
    if (framework === 'jest') {
      command = 'npm test --';
      if (filePath) {
        command += ` ${filePath}`;
      } else if (testPattern) {
        command += ` --testPathPattern="${testPattern}"`;
      }
      command += ' --passWithNoTests';
    } else if (framework === 'mocha') {
      command = 'npm run test:mocha';
      if (filePath) {
        command += ` ${filePath}`;
      } else if (testPattern) {
        command += ` --grep "${testPattern}"`;
      }
    } else {
      throw new Error(`Unsupported test framework: ${framework}`);
    }

    const { stdout, stderr } = await execPromise(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    // Parse test results
    const results = parseTestOutput(stdout + stderr, framework);
    
    return results;
  } catch (error) {
    // Test failure is not an execution error
    if (error.code === 1 && error.stdout) {
      const results = parseTestOutput(error.stdout + error.stderr, framework);
      return results;
    }
    
    throw new Error(`Failed to run tests: ${error.message}`);
  }
}

/**
 * Parse test output
 */
function parseTestOutput(output, framework) {
  const results = {
    passed: false,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    failures: [],
    coverage: null
  };

  if (framework === 'jest') {
    // Parse Jest output
    const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testMatch) {
      results.failedTests = parseInt(testMatch[1], 10);
      results.passedTests = parseInt(testMatch[2], 10);
      results.totalTests = parseInt(testMatch[3], 10);
    } else {
      const passMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (passMatch) {
        results.passedTests = parseInt(passMatch[1], 10);
        results.totalTests = parseInt(passMatch[2], 10);
        results.failedTests = 0;
      }
    }

    // Check if all tests passed
    results.passed = results.failedTests === 0 && results.totalTests > 0;

    // Parse duration
    const durationMatch = output.match(/Time:\s+(\d+\.?\d*)\s*s/);
    if (durationMatch) {
      results.duration = parseFloat(durationMatch[1]);
    }

    // Parse failures
    const failureRegex = /●\s+(.*?)\n\n\s+(.*?)(?=\n\s+\d+\s+\||$)/gs;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      results.failures.push({
        test: match[1].trim(),
        message: match[2].trim()
      });
    }

    // Parse coverage if available
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      results.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }
  }

  return results;
}

/**
 * Run specific test file
 */
async function runTestFile({ filePath, framework = 'jest' }) {
  return runTests({ filePath, framework });
}

/**
 * Run tests matching pattern
 */
async function runTestPattern({ pattern, framework = 'jest' }) {
  return runTests({ testPattern: pattern, framework });
}

/**
 * Check test coverage
 */
async function checkCoverage({ threshold = 80 }) {
  try {
    const { stdout, stderr } = await execPromise('npm test -- --coverage --coverageReporters=json-summary', {
      timeout: 60000,
      maxBuffer: 1024 * 1024
    });

    // Read coverage summary
    const fs = require('fs').promises;
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    try {
      const coverageData = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
      const total = coverageData.total;
      
      const meetsThreshold = 
        total.lines.pct >= threshold &&
        total.statements.pct >= threshold &&
        total.functions.pct >= threshold &&
        total.branches.pct >= threshold;

      return {
        passed: meetsThreshold,
        threshold,
        coverage: {
          lines: total.lines.pct,
          statements: total.statements.pct,
          functions: total.functions.pct,
          branches: total.branches.pct
        }
      };
    } catch (error) {
      throw new Error('Coverage report not found');
    }
  } catch (error) {
    throw new Error(`Failed to check coverage: ${error.message}`);
  }
}

/**
 * Generate test report
 */
async function generateTestReport({ format = 'json' }) {
  try {
    const results = await runTests({});
    
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    } else if (format === 'html') {
      return generateHTMLReport(results);
    } else {
      return results;
    }
  } catch (error) {
    throw new Error(`Failed to generate test report: ${error.message}`);
  }
}

/**
 * Generate HTML test report
 */
function generateHTMLReport(results) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    .passed { color: green; }
    .failed { color: red; }
    .failure { background: #ffe0e0; padding: 10px; margin: 10px 0; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <div class="summary">
    <p><strong>Total Tests:</strong> ${results.totalTests}</p>
    <p class="passed"><strong>Passed:</strong> ${results.passedTests}</p>
    <p class="failed"><strong>Failed:</strong> ${results.failedTests}</p>
    <p><strong>Duration:</strong> ${results.duration}s</p>
  </div>
  
  ${results.failures.length > 0 ? `
    <h2>Failures</h2>
    ${results.failures.map(f => `
      <div class="failure">
        <strong>${f.test}</strong>
        <pre>${f.message}</pre>
      </div>
    `).join('')}
  ` : ''}
  
  ${results.coverage ? `
    <h2>Coverage</h2>
    <div class="summary">
      <p><strong>Statements:</strong> ${results.coverage.statements}%</p>
      <p><strong>Branches:</strong> ${results.coverage.branches}%</p>
      <p><strong>Functions:</strong> ${results.coverage.functions}%</p>
      <p><strong>Lines:</strong> ${results.coverage.lines}%</p>
    </div>
  ` : ''}
</body>
</html>
  `;
}

module.exports = {
  runTests,
  runTestFile,
  runTestPattern,
  checkCoverage,
  generateTestReport
};
