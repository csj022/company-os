import { Bot, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusIndicator } from '../components/ui/StatusIndicator';

export function Agents() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Agent Orchestration Console</h1>
          <p className="text-slate-400 mt-1">
            AI agent system management and monitoring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Agents */}
        <Card>
          <CardHeader>
            <span>Active Agents</span>
            <StatusIndicator status="online" />
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">8</div>
          <div className="text-sm text-slate-400">2 idle</div>
        </Card>

        {/* Tasks Completed */}
        <Card>
          <CardHeader>
            <span>Tasks Today</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">142</div>
          <div className="text-sm text-emerald-400">+18% vs yesterday</div>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader>
            <span>Success Rate</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">96%</div>
          <div className="text-sm text-emerald-400">Above target</div>
        </Card>

        {/* Queue */}
        <Card>
          <CardHeader>
            <span>Task Queue</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">12</div>
          <div className="text-sm text-slate-400">Avg wait: 30s</div>
        </Card>
      </div>

      {/* Agent List */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Active Agents</span>
          </CardHeader>
          <div className="space-y-3">
            {[
              { name: 'Code Review Agent', type: 'Specialist', status: 'running', task: 'Reviewing PR #234', performance: 98 },
              { name: 'Deployment Agent', type: 'Executor', status: 'running', task: 'Monitoring production', performance: 100 },
              { name: 'Content Strategist', type: 'Coordinator', status: 'running', task: 'Planning content calendar', performance: 94 },
              { name: 'Communication Agent', type: 'Specialist', status: 'idle', task: 'Awaiting messages', performance: 96 },
              { name: 'Analytics Agent', type: 'Reporter', status: 'running', task: 'Generating insights', performance: 92 },
              { name: 'Design QA Agent', type: 'Specialist', status: 'idle', task: 'Ready', performance: 95 },
            ].map((agent, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#0176D3]/20">
                    <Bot className="w-6 h-6 text-[#0176D3]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium">{agent.name}</h3>
                        <p className="text-sm text-slate-400">{agent.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={agent.status === 'running' ? 'success' : 'neutral'}>
                          {agent.status}
                        </Badge>
                        <StatusIndicator status={agent.status === 'running' ? 'online' : 'offline'} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Activity className="w-4 h-4" />
                        <span>{agent.task}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{agent.performance}% accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Agent Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Recent Actions</span>
            <Badge variant="primary">Live</Badge>
          </CardHeader>
          <div className="space-y-3">
            {[
              { agent: 'Deployment Agent', action: 'Completed production deployment', time: '2m ago', status: 'success' },
              { agent: 'Code Review Agent', action: 'Approved PR #234', time: '15m ago', status: 'success' },
              { agent: 'Content Strategist', action: 'Scheduled 3 social posts', time: '1h ago', status: 'success' },
              { agent: 'Analytics Agent', action: 'Generated weekly report', time: '2h ago', status: 'success' },
            ].map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#232931] transition-all">
                <div className="mt-1">
                  {action.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{action.agent}</p>
                  <p className="text-slate-400 text-sm">{action.action}</p>
                  <p className="text-slate-500 text-xs mt-1">{action.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
