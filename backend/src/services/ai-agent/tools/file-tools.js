/**
 * File Operation Tools
 * Tools for reading, writing, and parsing files
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const prettier = require('prettier');
const { ESLint } = require('eslint');

/**
 * Read a file
 */
async function readFile({ filePath }) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write a file
 */
async function writeFile({ filePath, content, backup = true }) {
  try {
    // Create backup if file exists
    if (backup) {
      try {
        await fs.access(filePath);
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
      } catch (error) {
        // File doesn't exist, no backup needed
      }
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
    
    return { filePath, size: content.length };
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Parse code to AST
 */
async function parseCode({ code, language = 'javascript' }) {
  try {
    if (language === 'javascript' || language === 'typescript') {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'dynamicImport'
        ]
      });
      
      return {
        valid: true,
        ast,
        errors: []
      };
    } else {
      // For other languages, just check if it's not empty
      return {
        valid: code.trim().length > 0,
        ast: null,
        errors: []
      };
    }
  } catch (error) {
    return {
      valid: false,
      ast: null,
      errors: [error.message]
    };
  }
}

/**
 * Run linter on code
 */
async function runLinter({ code, language = 'javascript', filePath = null }) {
  try {
    if (language !== 'javascript' && language !== 'typescript') {
      // Skip linting for non-JS languages
      return {
        passed: true,
        warnings: [],
        errors: []
      };
    }

    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: {
        env: {
          browser: true,
          node: true,
          es2021: true
        },
        extends: ['eslint:recommended'],
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module'
        }
      }
    });

    const results = await eslint.lintText(code, {
      filePath: filePath || 'input.js'
    });

    const warnings = [];
    const errors = [];

    for (const result of results) {
      for (const message of result.messages) {
        const issue = `${message.line}:${message.column} - ${message.message} (${message.ruleId})`;
        if (message.severity === 2) {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }

    return {
      passed: errors.length === 0,
      warnings,
      errors
    };
  } catch (error) {
    return {
      passed: false,
      warnings: [],
      errors: [error.message]
    };
  }
}

/**
 * Format code
 */
async function runFormatter({ code, language = 'javascript' }) {
  try {
    let parser = 'babel';
    
    if (language === 'typescript') {
      parser = 'typescript';
    } else if (language === 'json') {
      parser = 'json';
    } else if (language === 'css' || language === 'scss') {
      parser = 'css';
    } else if (language === 'html') {
      parser = 'html';
    }

    const formatted = await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2
    });

    return {
      formatted,
      changed: formatted !== code
    };
  } catch (error) {
    // If formatting fails, return original code
    return {
      formatted: code,
      changed: false,
      error: error.message
    };
  }
}

/**
 * List files in directory
 */
async function listFiles({ directory, pattern = null }) {
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    
    let result = files
      .filter(dirent => dirent.isFile())
      .map(dirent => path.join(directory, dirent.name));

    if (pattern) {
      const regex = new RegExp(pattern);
      result = result.filter(file => regex.test(file));
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to list files in ${directory}: ${error.message}`);
  }
}

/**
 * Check if file exists
 */
async function fileExists({ filePath }) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file stats
 */
async function getFileStats({ filePath }) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
  }
}

module.exports = {
  readFile,
  writeFile,
  parseCode,
  runLinter,
  runFormatter,
  listFiles,
  fileExists,
  getFileStats
};
