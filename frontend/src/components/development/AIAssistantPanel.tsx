import { useState } from 'react';
import {
  Sparkles,
  Send,
  Code2,
  Lightbulb,
  Bug,
  RefreshCw,
  Copy,
  Check,
  Settings,
  Wand2,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'code' | 'text' | 'suggestion';
}

interface Suggestion {
  id: string;
  type: 'refactor' | 'bug-fix' | 'optimization' | 'documentation';
  title: string;
  description: string;
  code?: string;
}

export function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm your AI coding assistant. I can help you with code reviews, refactoring, bug fixes, and more. How can I help you today?",
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions] = useState<Suggestion[]>([
    {
      id: '1',
      type: 'refactor',
      title: 'Extract Component',
      description: 'This function could be extracted into a separate component',
      code: 'export function UserProfile({ user }) { ... }',
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Use useMemo',
      description: 'This calculation could be memoized to improve performance',
      code: 'const total = useMemo(() => items.reduce(...), [items]);',
    },
  ]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call AI assistant API
      const response = await api.post<{ message: string; type?: string }>('/api/ai/assistant/chat', {
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context: {
          file: 'current-file.tsx', // Would come from editor
          selection: '', // Would come from editor selection
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        type: (response.type as 'code' | 'text' | 'suggestion') || 'text',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    try {
      await api.post('/api/ai/assistant/apply-suggestion', {
        suggestionId: suggestion.id,
        code: suggestion.code,
      });
      alert('Suggestion applied successfully!');
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      alert('Failed to apply suggestion. Check console for details.');
    }
  };

  const quickActions = [
    {
      icon: Code2,
      label: 'Review Code',
      prompt: 'Review the current file for best practices and potential issues',
    },
    {
      icon: Bug,
      label: 'Find Bugs',
      prompt: 'Analyze the code for potential bugs and edge cases',
    },
    {
      icon: Lightbulb,
      label: 'Suggest Improvements',
      prompt: 'Suggest improvements and optimizations for this code',
    },
    {
      icon: Wand2,
      label: 'Add Comments',
      prompt: 'Add helpful comments and documentation to this code',
    },
  ];

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'refactor':
        return <Code2 className="w-4 h-4 text-blue-400" />;
      case 'bug-fix':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'optimization':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'documentation':
        return <Wand2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Quick Actions</span>
          </div>
          <Button variant="secondary" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </CardHeader>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => {
                  setInput(action.prompt);
                  handleSendMessage();
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-colors text-center"
              >
                <Icon className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-slate-300">{action.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-sm">AI Suggestions</span>
            <Badge variant="warning">{suggestions.length}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-3 rounded-lg bg-[#232931] border border-[#2A3240]"
              >
                <div className="flex items-start gap-2 mb-2">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-medium">{suggestion.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{suggestion.description}</p>
                  </div>
                </div>
                {suggestion.code && (
                  <div className="mt-2">
                    <pre className="bg-[#0A0E12] rounded p-2 text-xs text-slate-300 font-mono overflow-x-auto">
                      {suggestion.code}
                    </pre>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => handleApplySuggestion(suggestion)}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                      >
                        Apply
                      </Button>
                      <Button
                        onClick={() => handleCopyCode(suggestion.code!, suggestion.id)}
                        variant="secondary"
                        size="sm"
                      >
                        {copiedId === suggestion.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chat */}
      <Card>
        <CardHeader>
          <span className="text-sm">Chat</span>
          <Button onClick={() => setMessages([])} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/20'
                    : 'bg-[#232931] border border-[#2A3240]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'assistant' && (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="text-xs text-slate-500">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>
                {message.type === 'code' ? (
                  <pre className="bg-[#0A0E12] rounded p-2 text-xs text-slate-300 font-mono overflow-x-auto">
                    {message.content}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#232931] border border-[#2A3240] rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI anything about your code..."
            className="flex-1 bg-[#232931] text-white text-sm px-4 py-2 rounded-lg border border-[#2A3240] focus:border-blue-500 outline-none"
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            variant="primary"
            disabled={!input.trim() || loading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
