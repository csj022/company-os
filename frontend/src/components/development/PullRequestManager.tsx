import { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitMerge,
  GitBranch,
  MessageSquare,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  authorGithubId: number;
  baseBranch: string;
  headBranch: string;
  draft: boolean;
  mergeable: boolean | null;
  reviewStatus: string | null;
  agentReviewStatus: string | null;
  metadata: {
    author?: {
      login: string;
      avatarUrl: string;
    };
    htmlUrl?: string;
    commentsCount?: number;
    reviewsCount?: number;
    additions?: number;
    deletions?: number;
  };
  openedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  updatedAt: string;
}

interface PullRequestManagerProps {
  onSelectPR: (prId: string) => void;
}

export function PullRequestManager({ onSelectPR }: PullRequestManagerProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'merged' | 'closed'>('open');
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);

  useEffect(() => {
    loadPullRequests();
  }, [filter]);

  const loadPullRequests = async () => {
    try {
      setLoading(true);
      const state = filter === 'all' ? undefined : filter;
      const response = await api.get<{ pullRequests: PullRequest[] }>('/api/github/pull-requests', {
        params: { state },
      });
      setPullRequests(response.pullRequests || []);
    } catch (error) {
      console.error('Failed to load pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPR = (pr: PullRequest) => {
    setSelectedPR(pr);
    onSelectPR(pr.id);
  };

  const handleMergePR = async (pr: PullRequest) => {
    if (!confirm(`Are you sure you want to merge PR #${pr.number}?`)) {
      return;
    }

    try {
      await api.post(`/api/github/pull-requests/${pr.id}/merge`);
      await loadPullRequests();
    } catch (error) {
      console.error('Failed to merge PR:', error);
      alert('Failed to merge PR. Check console for details.');
    }
  };

  const handleRequestReview = async (pr: PullRequest) => {
    try {
      await api.post(`/api/github/pull-requests/${pr.id}/request-review`);
      await loadPullRequests();
    } catch (error) {
      console.error('Failed to request review:', error);
    }
  };

  const getReviewStatusBadge = (pr: PullRequest) => {
    if (pr.draft) {
      return <Badge variant="neutral">Draft</Badge>;
    }

    switch (pr.reviewStatus) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'changes_requested':
        return <Badge variant="error">Changes Requested</Badge>;
      case 'pending':
        return <Badge variant="warning">Review Pending</Badge>;
      default:
        return <Badge variant="neutral">No Reviews</Badge>;
    }
  };

  const getAgentReviewBadge = (pr: PullRequest) => {
    switch (pr.agentReviewStatus) {
      case 'completed':
        return <Badge variant="success">AI Reviewed</Badge>;
      case 'in_progress':
        return <Badge variant="warning">AI Reviewing...</Badge>;
      case 'not_started':
        return <Badge variant="neutral">Not Reviewed</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
            >
              All
            </Button>
            <Button
              onClick={() => setFilter('open')}
              variant={filter === 'open' ? 'primary' : 'secondary'}
              size="sm"
            >
              <GitPullRequest className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button
              onClick={() => setFilter('merged')}
              variant={filter === 'merged' ? 'primary' : 'secondary'}
              size="sm"
            >
              <GitMerge className="w-4 h-4 mr-1" />
              Merged
            </Button>
            <Button
              onClick={() => setFilter('closed')}
              variant={filter === 'closed' ? 'primary' : 'secondary'}
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Closed
            </Button>
          </div>
          <Button onClick={loadPullRequests} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Pull Request List */}
      <div className="space-y-4">
        {pullRequests.map((pr) => (
          <Card
            key={pr.id}
            className={`cursor-pointer transition-all ${
              selectedPR?.id === pr.id
                ? 'border-blue-500 bg-blue-500/5'
                : 'hover:border-blue-500/50'
            }`}
            onClick={() => handleSelectPR(pr)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <GitPullRequest
                    className={`w-5 h-5 mt-1 ${
                      pr.state === 'merged'
                        ? 'text-purple-400'
                        : pr.state === 'closed'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">
                      #{pr.number} {pr.title}
                    </h3>
                    {pr.metadata.author && (
                      <p className="text-sm text-slate-400 mt-1">
                        by @{pr.metadata.author.login} • opened {formatDate(pr.openedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getReviewStatusBadge(pr)}
                  {getAgentReviewBadge(pr)}
                </div>
              </div>

              {/* Body Preview */}
              {pr.body && (
                <p className="text-sm text-slate-300 line-clamp-2 pl-8">{pr.body}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-400 pl-8">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span>
                    {pr.headBranch} → {pr.baseBranch}
                  </span>
                </div>
                {pr.metadata.commentsCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{pr.metadata.commentsCount}</span>
                  </div>
                )}
                {pr.metadata.additions !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400">+{pr.metadata.additions}</span>
                    <span className="text-red-400">-{pr.metadata.deletions}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {pr.state === 'open' && (
                <div className="flex gap-2 pt-4 border-t border-[#2A3240]">
                  {pr.reviewStatus === 'approved' && pr.mergeable && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMergePR(pr);
                      }}
                      variant="primary"
                      size="sm"
                    >
                      <GitMerge className="w-4 h-4 mr-2" />
                      Merge
                    </Button>
                  )}
                  {pr.agentReviewStatus === 'not_started' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestReview(pr);
                      }}
                      variant="primary"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Request AI Review
                    </Button>
                  )}
                  {pr.metadata.htmlUrl && (
                    <a
                      href={pr.metadata.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on GitHub
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {pullRequests.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <GitPullRequest className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No pull requests found</h3>
            <p className="text-slate-400 text-sm">
              {filter === 'open'
                ? 'No open pull requests at the moment'
                : `No ${filter} pull requests found`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
