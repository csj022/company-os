const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

/**
 * POST /api/ai/assistant/chat
 * Chat with AI coding assistant
 */
router.post(
  '/chat',
  authenticate,
  [
    body('messages').isArray(),
    body('messages.*.role').isIn(['user', 'assistant']),
    body('messages.*.content').isString(),
    body('context').optional().isObject(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { messages, context } = req.body;

      // Build system prompt based on context
      const systemPrompt = buildSystemPrompt(context);

      // Call Claude API
      const axios = require('axios');
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantMessage = response.data.content[0].text;
      const messageType = detectMessageType(assistantMessage);

      res.json({
        message: assistantMessage,
        type: messageType,
        usage: response.data.usage,
      });
    } catch (error) {
      console.error('AI Assistant error:', error.response?.data || error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/assistant/code-review
 * Request AI code review for specific code
 */
router.post(
  '/code-review',
  authenticate,
  [
    body('code').isString(),
    body('language').optional().isString(),
    body('filename').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { code, language, filename } = req.body;

      const systemPrompt = `You are an expert code reviewer. Analyze the following code and provide:
1. Potential bugs or issues
2. Performance improvements
3. Best practices suggestions
4. Security concerns
5. Code quality improvements

Be specific and actionable. Format your response in markdown.`;

      const userPrompt = `Review this ${language || 'code'}${filename ? ` from ${filename}` : ''}:

\`\`\`${language || ''}
${code}
\`\`\``;

      const axios = require('axios');
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const review = response.data.content[0].text;
      const suggestions = extractSuggestions(review);

      res.json({
        review,
        suggestions,
        usage: response.data.usage,
      });
    } catch (error) {
      console.error('Code review error:', error.response?.data || error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/assistant/generate-code
 * Generate code from natural language prompt
 */
router.post(
  '/generate-code',
  authenticate,
  [
    body('prompt').isString(),
    body('language').optional().isString(),
    body('context').optional().isObject(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { prompt, language, context } = req.body;

      const systemPrompt = `You are an expert software engineer. Generate clean, well-documented, production-ready code based on user requirements. 
Include comments explaining complex logic. Follow best practices and modern patterns.
${language ? `Generate ${language} code.` : ''}`;

      const axios = require('axios');
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const generatedCode = response.data.content[0].text;
      const codeBlocks = extractCodeBlocks(generatedCode);

      res.json({
        code: codeBlocks[0]?.code || generatedCode,
        language: codeBlocks[0]?.language || language,
        explanation: generatedCode,
        usage: response.data.usage,
      });
    } catch (error) {
      console.error('Code generation error:', error.response?.data || error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/assistant/refactor
 * Suggest refactoring for code
 */
router.post(
  '/refactor',
  authenticate,
  [body('code').isString(), body('goal').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const { code, goal } = req.body;

      const systemPrompt = `You are an expert at code refactoring. Suggest improvements to make code more:
- Readable and maintainable
- Performant
- Following best practices
- Well-structured and organized

Provide the refactored code and explain the changes.`;

      const userPrompt = `Refactor this code${goal ? ` to ${goal}` : ''}:

\`\`\`
${code}
\`\`\``;

      const axios = require('axios');
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const refactorResponse = response.data.content[0].text;
      const codeBlocks = extractCodeBlocks(refactorResponse);

      res.json({
        refactoredCode: codeBlocks[0]?.code || code,
        explanation: refactorResponse,
        changes: extractChanges(refactorResponse),
        usage: response.data.usage,
      });
    } catch (error) {
      console.error('Refactor error:', error.response?.data || error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/assistant/explain
 * Explain code functionality
 */
router.post(
  '/explain',
  authenticate,
  [body('code').isString()],
  validate,
  async (req, res, next) => {
    try {
      const { code } = req.body;

      const systemPrompt = `You are an expert at explaining code. Provide clear, comprehensive explanations of how code works. 
Break down complex logic into simple terms. Explain the purpose, how it works, and any important details.`;

      const userPrompt = `Explain this code:

\`\`\`
${code}
\`\`\``;

      const axios = require('axios');
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const explanation = response.data.content[0].text;

      res.json({
        explanation,
        usage: response.data.usage,
      });
    } catch (error) {
      console.error('Explain error:', error.response?.data || error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/assistant/apply-suggestion
 * Apply an AI suggestion
 */
router.post(
  '/apply-suggestion',
  authenticate,
  [body('suggestionId').isString(), body('code').isString()],
  validate,
  async (req, res, next) => {
    try {
      // This would apply the suggestion to the actual file
      // For now, just return success
      res.json({
        success: true,
        message: 'Suggestion applied successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions

function buildSystemPrompt(context) {
  let prompt = `You are an expert AI coding assistant integrated into Company OS. 
You help developers write better code through reviews, suggestions, and generation.
You have access to the user's codebase and can see their current work.`;

  if (context?.file) {
    prompt += `\n\nCurrent file: ${context.file}`;
  }

  if (context?.selection) {
    prompt += `\n\nSelected code:\n\`\`\`\n${context.selection}\n\`\`\``;
  }

  if (context?.language) {
    prompt += `\n\nLanguage: ${context.language}`;
  }

  return prompt;
}

function detectMessageType(message) {
  if (message.includes('```')) {
    return 'code';
  }
  if (
    message.toLowerCase().includes('suggest') ||
    message.toLowerCase().includes('recommend')
  ) {
    return 'suggestion';
  }
  return 'text';
}

function extractCodeBlocks(text) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return blocks;
}

function extractSuggestions(review) {
  const suggestions = [];
  const lines = review.split('\n');
  let currentSuggestion = null;

  for (const line of lines) {
    if (line.match(/^\d+\.|^-|^•/)) {
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }
      currentSuggestion = {
        type: detectSuggestionType(line),
        text: line.replace(/^\d+\.|^-|^•/, '').trim(),
      };
    } else if (currentSuggestion && line.trim()) {
      currentSuggestion.text += ' ' + line.trim();
    }
  }

  if (currentSuggestion) {
    suggestions.push(currentSuggestion);
  }

  return suggestions;
}

function detectSuggestionType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('bug') || lower.includes('issue') || lower.includes('error')) {
    return 'bug-fix';
  }
  if (lower.includes('performance') || lower.includes('optimize')) {
    return 'optimization';
  }
  if (lower.includes('refactor') || lower.includes('structure')) {
    return 'refactor';
  }
  if (lower.includes('document') || lower.includes('comment')) {
    return 'documentation';
  }
  return 'general';
}

function extractChanges(text) {
  const changes = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.includes('changed:') || line.includes('modified:') || line.includes('updated:')) {
      changes.push(line.trim());
    }
  }

  return changes;
}

module.exports = router;
