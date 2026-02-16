import { Bot, Sparkles } from 'lucide-react';
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
            <StatusIndicator status="offline" />
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">No agents running</div>
        </Card>

        {/* Tasks Completed */}
        <Card>
          <CardHeader>
            <span>Tasks Today</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">No tasks yet</div>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader>
            <span>Success Rate</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">--</div>
          <div className="text-sm text-slate-400">Coming soon</div>
        </Card>

        {/* Queue */}
        <Card>
          <CardHeader>
            <span>Task Queue</span>
          </CardHeader>
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-slate-400">No tasks queued</div>
        </Card>
      </div>

      {/* Agent List */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Active Agents</span>
          </CardHeader>
          <div className="text-center py-16">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No agents configured yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              AI agents will help automate your workflows. Configure your first agent to get started with code reviews, deployments, and more.
            </p>
            <button className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-[#015FB0] text-white transition-all">
              Configure First Agent
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Agent Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Recent Actions</span>
            <Badge variant="neutral">Coming Soon</Badge>
          </CardHeader>
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No activity yet</h3>
            <p className="text-slate-400 text-sm">
              Agent actions and automation history will appear here
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
