import { useState, useEffect } from 'react';
import { Activity, GitPullRequest, Users, TrendingUp, RefreshCw, Inbox } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { api } from '../lib/api';

interface DashboardStats {
  deployments: { total: number; trend?: string };
  pullRequests: { total: number; needReview: number };
  team: { active: number; total: number };
  social: { engagement: number; trend?: string };
}

interface Activity {
  type: string;
  text: string;
  time: string;
  status: 'success' | 'primary' | 'neutral' | 'warning' | 'error';
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Try to load real data from API
      const [deploymentsRes, prsRes] = await Promise.all([
        api.get('/api/deployments?limit=30').catch(() => ({ deployments: [] })),
        api.get('/api/github/pull-requests?state=open').catch(() => ({ pullRequests: [] })),
      ]);

      const deployments = deploymentsRes.deployments || [];
      const pullRequests = prsRes.pullRequests || [];

      setStats({
        deployments: { total: deployments.length },
        pullRequests: {
          total: pullRequests.length,
          needReview: pullRequests.filter((pr: any) => pr.reviewStatus === 'pending').length,
        },
        team: { active: 0, total: 0 },
        social: { engagement: 0 },
      });

      // TODO: Load real activity feed from backend
      setActivities([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats({
        deployments: { total: 0 },
        pullRequests: { total: 0, needReview: 0 },
        team: { active: 0, total: 0 },
        social: { engagement: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  const showEmptyState = !stats || (
    stats.deployments.total === 0 &&
    stats.pullRequests.total === 0 &&
    activities.length === 0
  );

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Command Center</h1>
          <p className="text-slate-400 mt-1">
            Real-time company health and mission control
          </p>
        </div>
      </div>

      {showEmptyState ? (
        <Card>
          <div className="text-center py-16">
            <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Company OS</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Your dashboard will come alive once you connect your services and start working.
              Get started by connecting GitHub, deploying your first project, or inviting your team.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-[#015FB0] text-white transition-all">
                Connect GitHub
              </button>
              <button className="px-4 py-2 rounded-lg bg-[#232931] hover:bg-[#2A3240] text-white transition-all">
                Explore Features
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <span>Deployments</span>
                <StatusIndicator status={stats.deployments.total > 0 ? 'online' : 'offline'} />
              </CardHeader>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.deployments.total}
                  </div>
                  <div className="text-sm text-slate-400">
                    {stats.deployments.total === 0 ? 'No deployments yet' : 'Total deployments'}
                  </div>
                </div>
                <Activity className="w-8 h-8 text-slate-600" />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <span>Open PRs</span>
                {stats.pullRequests.needReview > 0 && (
                  <Badge variant="warning">{stats.pullRequests.needReview} need review</Badge>
                )}
              </CardHeader>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.pullRequests.total}
                  </div>
                  <div className="text-sm text-slate-400">
                    {stats.pullRequests.total === 0 ? 'No open PRs' : 'Open pull requests'}
                  </div>
                </div>
                <GitPullRequest className="w-8 h-8 text-slate-600" />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <span>Team Active</span>
                <StatusIndicator status="offline" />
              </CardHeader>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.team.active}/{stats.team.total}
                  </div>
                  <div className="text-sm text-slate-400">Coming soon</div>
                </div>
                <Users className="w-8 h-8 text-slate-600" />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <span>Social Engagement</span>
                <StatusIndicator status="offline" />
              </CardHeader>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.social.engagement}
                  </div>
                  <div className="text-sm text-slate-400">Coming soon</div>
                </div>
                <Activity className="w-8 h-8 text-slate-600" />
              </div>
            </Card>
          </div>

          {/* Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <span>Recent Activity</span>
                  <Badge variant="neutral">Coming Soon</Badge>
                </CardHeader>
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No activity yet</h3>
                  <p className="text-slate-400 text-sm">
                    Recent deployments, PRs, and team activity will appear here
                  </p>
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <span>Quick Actions</span>
                </CardHeader>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-[#232931] hover:bg-[#2A3240] text-white transition-all">
                    Deploy to production
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-[#232931] hover:bg-[#2A3240] text-white transition-all">
                    Review pending PRs
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-[#232931] hover:bg-[#2A3240] text-white transition-all">
                    Schedule social post
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-[#232931] hover:bg-[#2A3240] text-white transition-all">
                    View team status
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
