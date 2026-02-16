import { Activity, GitPullRequest, Users, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusIndicator } from '../components/ui/StatusIndicator';

export function Dashboard() {
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

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <span>Deployments</span>
            <StatusIndicator status="online" />
          </CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">24</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+12% this week</span>
              </div>
            </div>
            <Activity className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <span>Open PRs</span>
            <Badge variant="warning">3 need review</Badge>
          </CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">8</div>
              <div className="text-sm text-slate-400">2 ready to merge</div>
            </div>
            <GitPullRequest className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <span>Team Active</span>
            <StatusIndicator status="online" />
          </CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">12/15</div>
              <div className="text-sm text-slate-400">3 in meetings</div>
            </div>
            <Users className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <span>Social Engagement</span>
            <StatusIndicator status="online" />
          </CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">2.4K</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+8% today</span>
              </div>
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
              <Badge variant="primary">Live</Badge>
            </CardHeader>
            <div className="space-y-4">
              {[
                { type: 'deployment', text: 'Production deployment successful', time: '2m ago', status: 'success' },
                { type: 'pr', text: 'PR #234 merged to main', time: '15m ago', status: 'success' },
                { type: 'social', text: 'New post published on LinkedIn', time: '1h ago', status: 'primary' },
                { type: 'team', text: 'Sarah joined #engineering channel', time: '2h ago', status: 'neutral' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#232931] transition-all">
                  <div className="mt-1">
                    <StatusIndicator status="online" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.text}</p>
                    <p className="text-slate-400 text-xs mt-1">{activity.time}</p>
                  </div>
                  <Badge variant={activity.status as any}>{activity.type}</Badge>
                </div>
              ))}
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
    </div>
  );
}
