import { useState, useEffect } from 'react';
import {
  GitBranch,
  Star,
  GitFork,
  Clock,
  Search,
  ExternalLink,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  visibility: string;
  metadata: {
    description?: string;
    stars?: number;
    forks?: number;
    language?: string;
    updatedAt?: string;
    htmlUrl?: string;
  };
}

interface RepositoryBrowserProps {
  onSelectRepo: (repoId: string) => void;
}

export function RepositoryBrowser({ onSelectRepo }: RepositoryBrowserProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ repositories: Repository[] }>('/api/github/repositories');
      setRepositories(response.repositories || []);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repositories.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    onSelectRepo(repo.id);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

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
      {/* Search and Actions */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={loadRepositories} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Repository List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRepos.map((repo) => (
          <Card
            key={repo.id}
            className={`cursor-pointer transition-all ${
              selectedRepo?.id === repo.id
                ? 'border-blue-500 bg-blue-500/5'
                : 'hover:border-blue-500/50'
            }`}
            onClick={() => handleSelectRepo(repo)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <FolderGit2 className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium">{repo.name}</h3>
                    <p className="text-xs text-slate-500">{repo.fullName}</p>
                  </div>
                </div>
                <Badge variant={repo.visibility === 'public' ? 'success' : 'neutral'}>
                  {repo.visibility}
                </Badge>
              </div>

              {repo.metadata.description && (
                <p className="text-sm text-slate-400 line-clamp-2">
                  {repo.metadata.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-400">
                {repo.metadata.language && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{repo.metadata.language}</span>
                  </div>
                )}
                {repo.metadata.stars !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{repo.metadata.stars}</span>
                  </div>
                )}
                {repo.metadata.forks !== undefined && (
                  <div className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />
                    <span>{repo.metadata.forks}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#2A3240]">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <GitBranch className="w-4 h-4" />
                  <span>{repo.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(repo.metadata.updatedAt)}</span>
                </div>
              </div>

              {repo.metadata.htmlUrl && (
                <a
                  href={repo.metadata.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No repositories found</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Connect your GitHub account to see repositories'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
