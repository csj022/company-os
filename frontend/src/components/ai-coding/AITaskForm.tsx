/**
 * AI Task Form
 * Form for submitting new AI coding tasks
 */

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Code, Wand2, Bug, RefreshCw, TestTube, Eye } from 'lucide-react';

interface AITaskFormProps {
  onSuccess?: () => void;
}

type TaskType = 'generate' | 'fix' | 'refactor' | 'test' | 'review';

const AITaskForm: React.FC<AITaskFormProps> = ({ onSuccess }) => {
  const [taskType, setTaskType] = useState<TaskType>('generate');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [filePath, setFilePath] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [prNumber, setPrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const taskTypes = [
    { id: 'generate', label: 'Generate Feature', icon: Wand2, description: 'Create new code from description' },
    { id: 'fix', label: 'Fix Bug', icon: Bug, description: 'Fix issues in existing code' },
    { id: 'refactor', label: 'Refactor', icon: RefreshCw, description: 'Improve code quality' },
    { id: 'test', label: 'Add Tests', icon: TestTube, description: 'Generate test cases' },
    { id: 'review', label: 'Review PR', icon: Eye, description: 'AI code review' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = '/api/ai/generate-feature';
      let body: any = {
        description,
        language,
        filePath: filePath || undefined,
        autoApply: false
      };

      switch (taskType) {
        case 'fix':
          endpoint = '/api/ai/fix-bug';
          body = {
            code,
            issue: description,
            language,
            filePath: filePath || undefined,
            autoApply: false
          };
          break;
        case 'refactor':
          endpoint = '/api/ai/refactor';
          body = {
            code,
            goal: description,
            language,
            filePath: filePath || undefined
          };
          break;
        case 'test':
          endpoint = '/api/ai/add-tests';
          body = {
            code,
            framework: 'jest',
            coverage: 'comprehensive',
            language
          };
          break;
        case 'review':
          endpoint = '/api/ai/review-pr';
          body = {
            prNumber: parseInt(prNumber, 10),
            checkFor: ['bugs', 'security', 'performance', 'style']
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTaskTypeSelector = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {taskTypes.map((type) => {
        const Icon = type.icon;
        const isActive = taskType === type.id;
        
        return (
          <button
            key={type.id}
            onClick={() => setTaskType(type.id as TaskType)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${isActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-blue-500' : 'text-gray-500'}`} />
            <h3 className={`font-semibold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
              {type.label}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{type.description}</p>
          </button>
        );
      })}
    </div>
  );

  const renderForm = () => {
    if (taskType === 'review') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pull Request Number
            </label>
            <Input
              type="number"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Description/Issue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {taskType === 'generate' ? 'Feature Description' : 
             taskType === 'fix' ? 'Bug Description' : 
             taskType === 'refactor' ? 'Refactoring Goal' : 
             'Description'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder={
              taskType === 'generate' ? 'e.g., Create a user authentication function using JWT' :
              taskType === 'fix' ? 'e.g., Function returns undefined instead of user object' :
              taskType === 'refactor' ? 'e.g., Improve readability and add error handling' :
              'Describe what you need...'
            }
            required={taskType !== 'test'}
          />
        </div>

        {/* Code Input (for fix, refactor, test) */}
        {(taskType === 'fix' || taskType === 'refactor' || taskType === 'test') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Existing Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={10}
              placeholder="Paste your code here..."
              required
            />
          </div>
        )}

        {/* Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>

          {/* File Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Path (Optional)
            </label>
            <Input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="src/utils/auth.js"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const classification = result.classification;
    const needsApproval = classification?.needsApproval;

    return (
      <Card className="mt-6 p-6 bg-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Result</h3>
            <p className="text-sm text-gray-600">Task ID: {result.taskId}</p>
          </div>
          
          {classification && (
            <div className="flex items-center gap-2">
              {needsApproval ? (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  Needs Approval
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Auto-Approved
                </span>
              )}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                classification.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                classification.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                classification.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {classification.riskLevel} risk
              </span>
            </div>
          )}
        </div>

        {/* Generated Code */}
        {(result.code || result.fixedCode || result.refactoredCode || result.testCode) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Code
            </label>
            <pre className="bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto">
              <code className="text-sm">
                {result.code || result.fixedCode || result.refactoredCode || result.testCode}
              </code>
            </pre>
          </div>
        )}

        {/* Review Result */}
        {result.review && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Review Summary</h4>
              <p className="text-gray-700">{result.review.summary}</p>
              <p className="text-sm text-gray-600 mt-1">Rating: {result.review.rating}/10</p>
            </div>

            {result.review.issues && result.review.issues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Issues Found</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.review.issues.map((issue: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.review.suggestions && result.review.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">Suggestions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.review.suggestions.map((suggestion: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Cost */}
        {result.cost !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Cost: <span className="font-semibold">${result.cost.toFixed(6)}</span>
            </p>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Create New AI Task</h2>
        
        {renderTaskTypeSelector()}

        <form onSubmit={handleSubmit}>
          {renderForm()}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Code className="w-4 h-4" />
                  Submit Task
                </span>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {renderResult()}
    </div>
  );
};

export default AITaskForm;
