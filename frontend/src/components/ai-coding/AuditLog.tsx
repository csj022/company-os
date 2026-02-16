/**
 * Audit Log Component
 * Displays comprehensive audit trail of all AI actions
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  FileCode, 
  Eye, 
  GitCommit, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Filter
} from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  type: string;
  taskId?: string;
  agentName?: string;
  [key: string]: any;
}

const AuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLog();
  }, [filter]);

  const loadAuditLog = async () => {
    try {
      let url = '/api/ai/audit-log?limit=100';
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'code_generation':
        return <FileCode className="w-5 h-5 text-blue-500" />;
      case 'code_review':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'commit':
        return <GitCommit className="w-5 h-5 text-green-500" />;
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rollback':
        return <RotateCcw className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'safety_check':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileCode className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString();
  };

  const renderEntryDetails = (entry: AuditEntry) => {
    const details: React.ReactElement[] = [];

    if (entry.type === 'code_generation') {
      details.push(
        <div key="description" className="text-sm text-gray-700">
          <strong>Description:</strong> {entry.input?.description}
        </div>
      );
      if (entry.output?.lineCount) {
        details.push(
          <div key="lines" className="text-sm text-gray-600">
            {entry.output.lineCount} lines • ${entry.cost?.toFixed(6)}
          </div>
        );
      }
      if (entry.needsApproval !== undefined) {
        details.push(
          <Badge key="approval" variant={entry.needsApproval ? "warning" : "success"}>
            {entry.needsApproval ? 'Needs Approval' : 'Auto-Approved'}
          </Badge>
        );
      }
    }

    if (entry.type === 'code_review') {
      details.push(
        <div key="file" className="text-sm text-gray-700">
          <strong>File:</strong> {entry.filePath}
        </div>
      );
      if (entry.review) {
        details.push(
          <div key="rating" className="text-sm text-gray-600">
            Rating: {entry.review.rating}/10 • {entry.review.issuesCount} issues
          </div>
        );
      }
    }

    if (entry.type === 'commit') {
      details.push(
        <div key="branch" className="text-sm text-gray-700">
          <strong>Branch:</strong> {entry.branch}
        </div>
      );
      if (entry.files) {
        details.push(
          <div key="files" className="text-sm text-gray-600">
            {entry.files.join(', ')}
          </div>
        );
      }
      if (entry.prNumber) {
        details.push(
          <Badge key="pr" variant="primary">PR #{entry.prNumber}</Badge>
        );
      }
    }

    if (entry.type === 'approval') {
      details.push(
        <div key="decision" className="text-sm text-gray-700">
          <strong>{entry.approved ? 'Approved' : 'Rejected'}</strong> by {entry.approvedBy}
        </div>
      );
      if (entry.reason) {
        details.push(
          <div key="reason" className="text-sm text-gray-600 italic">
            "{entry.reason}"
          </div>
        );
      }
    }

    if (entry.type === 'error') {
      details.push(
        <div key="error" className="text-sm text-red-700">
          <strong>Error:</strong> {entry.error?.message}
        </div>
      );
    }

    if (entry.type === 'safety_check') {
      details.push(
        <div key="checks" className="text-sm text-gray-700">
          <strong>Checks:</strong> {entry.checks?.join(', ')}
        </div>
      );
      details.push(
        <Badge key="passed" variant={entry.passed ? "success" : "error"}>
          {entry.passed ? 'Passed' : `Failed (${entry.issuesFound} issues)`}
        </Badge>
      );
    }

    return details;
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading audit log...</p>
      </Card>
    );
  }

  return (
    <div>
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2 flex-wrap">
            {['all', 'code_generation', 'code_review', 'commit', 'approval', 'error'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Audit Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No audit entries found.</p>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(entry.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getTypeLabel(entry.type)}
                      </h3>
                      {entry.agentName && (
                        <p className="text-sm text-gray-600">{entry.agentName}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {renderEntryDetails(entry)}
                  </div>

                  {entry.taskId && (
                    <div className="mt-2 text-xs text-gray-500 font-mono">
                      Task ID: {entry.taskId}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLog;
