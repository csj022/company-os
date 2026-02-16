import { useState, useEffect } from 'react';
import {
  GitBranch,
  GitPullRequest,
  Rocket,
  Code2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { RepositoryBrowser } from '../components/development/RepositoryBrowser';
import { PullRequestManager } from '../components/development/PullRequestManager';
import { DeploymentControls } from '../components/development/DeploymentControls';
import { CodeEditor } from '../components/development/CodeEditor';
import { AIAssistantPanel } from '../components/development/AIAssistantPanel';

type View = 'overview' | 'repositories' | 'pull-requests' | 'deployments' | 'editor';

interface Stats {
  repositories: number;
  openPullRequests: number;
  activeDeployments: number;
  recentCommits: number;
}

export function DevelopmentHub() {
  const [activeView, setActiveView] = useState<View>('overview');
  const [stats, setStats] = useState<Stats>({
    repositories: 0,
    openPullRequests: 0,
    activeDeployments: 0,
    recentCommits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [reposRes, prsRes, deploymentsRes] = await Promise.all([
        api.get<{ repositories: any[] }>('/api/github/repositories'),
        api.get<{ pullRequests: any[] }>('/api/github/pull-requests?state=open'),
        api.get<{ deployments: any[] }>('/api/deployments?state=building,ready'),
      ]);

      setStats({
        repositories: reposRes.repositories?.length || 0,
        openPullRequests: prsRes.pullRequests?.length || 0,
        activeDeployments: deploymentsRes.deployments?.length || 0,
        recentCommits: 0, // TODO: Implement commit counting
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className="cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => setActiveView('repositories')}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span>Repositories</span>
            </div>
            <Badge variant="neutral">{stats.repositories}</Badge>
          </CardHeader>
          <div className="text-2xl font-bold text-white mt-2">{stats.repositories}</div>
          <div className="text-sm text-slate-400 mt-1">Active projects</div>
        </Card>

        <Card
          className="cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => setActiveView('pull-requests')}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4" />
              <span>Pull Requests</span>
            </div>
            <Badge variant="warning">{stats.openPullRequests}</Badge>
          </CardHeader>
          <div className="text-2xl font-bold text-white mt-2">{stats.openPullRequests}</div>
          <div className="text-sm text-slate-400 mt-1">Open for review</div>
        </Card>

        <Card
          className="cursor-pointer hover:border-emerald-500/50 transition-colors"
          onClick={() => setActiveView('deployments')}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Deployments</span>
            </div>
            <Badge variant="success">{stats.activeDeployments}</Badge>
          </CardHeader>
          <div className="text-2xl font-bold text-white mt-2">{stats.activeDeployments}</div>
          <div className="text-sm text-slate-400 mt-1">Live environments</div>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-500/50 transition-colors"
          onClick={() => setActiveView('editor')}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Code Editor</span>
            </div>
            <Badge variant="neutral">AI</Badge>
          </CardHeader>
          <div className="text-2xl font-bold text-white mt-2">
            <Code2 className="w-8 h-8" />
          </div>
          <div className="text-sm text-slate-400 mt-1">Edit with AI assistant</div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <span>Recent Activity</span>
          <Button onClick={loadStats} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No recent activity</h3>
          <p className="text-slate-400 text-sm">
            Pull requests, deployments, and commits will appear here as you work
          </p>
        </div>
      </Card>
    </>
  );

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Development Hub</h1>
          <p className="text-slate-400 mt-1">
            GitHub, deployments, and AI-powered code editing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveView('overview')}
            variant={activeView === 'overview' ? 'primary' : 'secondary'}
          >
            Overview
          </Button>
          <Button
            onClick={() => setActiveView('repositories')}
            variant={activeView === 'repositories' ? 'primary' : 'secondary'}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Repositories
          </Button>
          <Button
            onClick={() => setActiveView('pull-requests')}
            variant={activeView === 'pull-requests' ? 'primary' : 'secondary'}
          >
            <GitPullRequest className="w-4 h-4 mr-2" />
            Pull Requests
          </Button>
          <Button
            onClick={() => setActiveView('deployments')}
            variant={activeView === 'deployments' ? 'primary' : 'secondary'}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deployments
          </Button>
          <Button
            onClick={() => setActiveView('editor')}
            variant={activeView === 'editor' ? 'primary' : 'secondary'}
          >
            <Code2 className="w-4 h-4 mr-2" />
            Editor
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          {activeView === 'overview' && renderOverview()}
          {activeView === 'repositories' && (
            <RepositoryBrowser onSelectRepo={setSelectedRepo} />
          )}
          {activeView === 'pull-requests' && (
            <PullRequestManager onSelectPR={() => {}} />
          )}
          {activeView === 'deployments' && <DeploymentControls />}
          {activeView === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <CodeEditor selectedRepo={selectedRepo} />
              </div>
              <div>
                <AIAssistantPanel />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
