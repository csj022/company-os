import { MessageSquare, Users, Calendar, UserPlus } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Team() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Team Coordination Center</h1>
          <p className="text-slate-400 mt-1">
            Slack integration and team communication
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Slack</span>
            </div>
            <Badge variant="neutral">Not Connected</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">
              Connect Slack to see team activity and channels
            </p>
            <button className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-[#015FB0] text-white text-sm transition-all">
              Connect Slack
            </button>
          </div>
        </Card>

        {/* Team Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Team Status</span>
            </div>
            <Badge variant="neutral">Coming Soon</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">
              Real-time team availability will appear here
            </p>
          </div>
        </Card>

        {/* Today's Meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Meetings Today</span>
            </div>
            <Badge variant="neutral">Coming Soon</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">
              Calendar integration coming soon
            </p>
          </div>
        </Card>
      </div>

      {/* Team Members */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Team Members</span>
          </CardHeader>
          <div className="text-center py-16">
            <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No team members yet</h3>
            <p className="text-slate-400 text-sm mb-6">
              Invite your team to collaborate on projects and see their activity here
            </p>
            <button className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-[#015FB0] text-white transition-all">
              Invite Team Members
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
