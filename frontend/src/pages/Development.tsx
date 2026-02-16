import { GitBranch, GitPullRequest, Rocket } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Development() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Development Hub</h1>
          <p className="text-slate-400 mt-1">
            GitHub, Vercel, and development workflow management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GitHub Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span>GitHub</span>
            </div>
            <Badge variant="success">Connected</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Active Repositories</span>
                <span className="text-white font-medium">12</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Open Issues</span>
                <span className="text-white font-medium">34</span>
              </div>
              <div className="flex justify-between">
                <span>Pull Requests</span>
                <span className="text-white font-medium">8</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Vercel Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Vercel</span>
            </div>
            <Badge variant="success">Online</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Active Deployments</span>
                <span className="text-white font-medium">3</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Preview Branches</span>
                <span className="text-white font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span>Last Deploy</span>
                <span className="text-emerald-400 font-medium">2m ago</span>
              </div>
            </div>
          </div>
        </Card>

        {/* PR Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4" />
              <span>Review Queue</span>
            </div>
            <Badge variant="warning">3 pending</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Awaiting Review</span>
                <span className="text-amber-400 font-medium">3</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Ready to Merge</span>
                <span className="text-emerald-400 font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Review Time</span>
                <span className="text-white font-medium">2.3h</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Recent Pull Requests</span>
          </CardHeader>
          <div className="space-y-3">
            {[
              { title: 'Add new authentication flow', author: 'sarah', status: 'open', reviews: 2 },
              { title: 'Update landing page design', author: 'john', status: 'approved', reviews: 3 },
              { title: 'Fix navigation bug on mobile', author: 'mike', status: 'changes-requested', reviews: 1 },
            ].map((pr, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{pr.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      by {pr.author} • {pr.reviews} reviews
                    </p>
                  </div>
                  <Badge
                    variant={
                      pr.status === 'approved'
                        ? 'success'
                        : pr.status === 'changes-requested'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {pr.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
