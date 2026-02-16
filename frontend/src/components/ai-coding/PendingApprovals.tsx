/**
 * Pending Approvals Component
 * Dashboard for reviewing and approving AI-generated code changes
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Code } from 'lucide-react';

interface PendingApprovalsProps {
  onUpdate?: () => void;
}

interface Task {
  id: string;
  timestamp: string;
  taskId: string;
  agentName: string;
  input: {
    description: string;
    language: string;
    filePath: string;
  };
  output: {
    lineCount: number;
    tokensUsed: number;
    cost: number;
  };
  needsApproval: boolean;
  approved?: boolean;
}

const PendingApprovals: React.FC<PendingApprovalsProps> = ({ onUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingTasks();
  }, []);

  const loadPendingTasks = async () => {
    try {
      const response = await fetch('/api/ai/pending-approvals?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to load pending tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string, comment: string = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/ai/approve/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'current-user-id', // Replace with actual user ID
          comment
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from pending list
        setTasks(tasks.filter(t => t.taskId !== taskId));
        setSelectedTask(null);
        
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to approve task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (taskId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ai/reject/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'current-user-id', // Replace with actual user ID
          reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTasks(tasks.filter(t => t.taskId !== taskId));
        setSelectedTask(null);
        
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (lineCount: number) => {
    if (lineCount > 100) {
      return <Badge variant="error">High Risk</Badge>;
    } else if (lineCount > 50) {
      return <Badge variant="warning">Medium Risk</Badge>;
    } else {
      return <Badge variant="success">Low Risk</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading pending approvals...</p>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
        <p className="text-gray-600">No pending approvals at this time.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pending Approvals ({tasks.length})</h2>
          <Button
            onClick={loadPendingTasks}
            size="sm"
            variant="secondary"
          >
            Refresh
          </Button>
        </div>

        {tasks.map((task) => (
          <Card
            key={task.taskId}
            className={`p-4 cursor-pointer transition-all ${
              selectedTask?.taskId === task.taskId
                ? 'ring-2 ring-blue-500'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedTask(task)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-sm text-gray-600">
                  {new Date(task.timestamp).toLocaleString()}
                </span>
              </div>
              {getRiskBadge(task.output.lineCount)}
            </div>

            <h3 className="font-semibold text-lg mb-1">
              {task.input.description}
            </h3>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Code className="w-4 h-4" />
                {task.input.language}
              </span>
              <span>{task.output.lineCount} lines</span>
              <span>${task.output.cost.toFixed(6)}</span>
            </div>

            {task.input.filePath && (
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {task.input.filePath}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Task Details & Approval */}
      <div className="lg:sticky lg:top-6">
        {selectedTask ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Review Code</h2>
              {getRiskBadge(selectedTask.output.lineCount)}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{selectedTask.input.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <p className="text-gray-900 mt-1">{selectedTask.input.language}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Lines Changed</label>
                  <p className="text-gray-900 mt-1">{selectedTask.output.lineCount}</p>
                </div>
              </div>

              {selectedTask.input.filePath && (
                <div>
                  <label className="text-sm font-medium text-gray-700">File Path</label>
                  <p className="text-gray-900 mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedTask.input.filePath}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Agent</label>
                <p className="text-gray-900 mt-1">{selectedTask.agentName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Cost</label>
                <p className="text-gray-900 mt-1">${selectedTask.output.cost.toFixed(6)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tokens Used</label>
                <p className="text-gray-900 mt-1">{selectedTask.output.tokensUsed.toLocaleString()}</p>
              </div>
            </div>

            {/* Code Preview (Demo - would fetch actual code) */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Generated Code Preview
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm font-mono text-gray-800">
                  {`// Generated code for: ${selectedTask.input.description}
// Language: ${selectedTask.input.language}
// Lines: ${selectedTask.output.lineCount}

// Code would be displayed here in production
function exampleFunction() {
  // Implementation...
}`}
                </pre>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => handleApprove(selectedTask.taskId)}
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Merge
              </Button>

              <Button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection:');
                  if (reason) {
                    handleReject(selectedTask.taskId, reason);
                  }
                }}
                disabled={actionLoading}
                variant="danger"
                className="w-full"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Changes
              </Button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Review Checklist:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Code follows project standards</li>
                  <li>No security vulnerabilities</li>
                  <li>Tests pass successfully</li>
                  <li>No breaking changes</li>
                  <li>Proper error handling</li>
                </ul>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Select a Task to Review
            </h3>
            <p className="text-gray-500">
              Click on a task from the list to review and approve or reject the changes.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
