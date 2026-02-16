import { Brain, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Intelligence() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Intelligence Hub</h1>
          <p className="text-slate-400 mt-1">
            Analytics, insights, and predictive intelligence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictive Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>AI Insights</span>
            </div>
            <Badge variant="primary">Live</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Predictions</span>
                <span className="text-white font-medium">24</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Recommendations</span>
                <span className="text-white font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy</span>
                <span className="text-emerald-400 font-medium">94%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trends</span>
            </div>
            <Badge variant="success">Positive</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Development Velocity</span>
                <span className="text-emerald-400 font-medium">+12%</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Team Productivity</span>
                <span className="text-emerald-400 font-medium">+8%</span>
              </div>
              <div className="flex justify-between">
                <span>Social Engagement</span>
                <span className="text-emerald-400 font-medium">+15%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Goals & OKRs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </div>
            <Badge variant="warning">2 at risk</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>On Track</span>
                <span className="text-emerald-400 font-medium">8</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>At Risk</span>
                <span className="text-amber-400 font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span>Completion</span>
                <span className="text-white font-medium">76%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Insights */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Key Insights</span>
            <Badge variant="primary">Today</Badge>
          </CardHeader>
          <div className="space-y-4">
            {[
              {
                type: 'success',
                title: 'Deployment Frequency Increased',
                description: 'Your team deployed 12% more frequently this week. Keep up the momentum!',
                action: 'View deployment stats',
              },
              {
                type: 'warning',
                title: 'PR Review Time Above Average',
                description: 'Average PR review time is 3.5 hours, 20% above team target.',
                action: 'Optimize review process',
              },
              {
                type: 'info',
                title: 'Social Media Growth Opportunity',
                description: 'LinkedIn engagement is 45% higher on Tuesdays. Consider scheduling more content.',
                action: 'Update content calendar',
              },
            ].map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  insight.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : insight.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {insight.type === 'success' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Brain className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{insight.title}</h3>
                    <p className="text-sm text-slate-300 mb-3">{insight.description}</p>
                    <button className="text-sm text-[#0176D3] hover:text-[#1A8FE3] font-medium">
                      {insight.action} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Analytics Overview */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <span>Cross-Platform Analytics</span>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">GitHub Activity</span>
                <span className="text-white font-medium">85%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#0176D3] rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Team Communication</span>
                <span className="text-white font-medium">92%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Social Engagement</span>
                <span className="text-white font-medium">78%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#0176D3] rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <span>Anomaly Detection</span>
          </CardHeader>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium mb-2">All Systems Normal</h3>
            <p className="text-sm text-slate-400">No anomalies detected in the last 24 hours</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
