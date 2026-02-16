import { MessageSquare, Users, Calendar } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusIndicator } from '../components/ui/StatusIndicator';

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
            <Badge variant="success">Connected</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Active Channels</span>
                <span className="text-white font-medium">24</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Team Members</span>
                <span className="text-white font-medium">15</span>
              </div>
              <div className="flex justify-between">
                <span>Messages Today</span>
                <span className="text-white font-medium">342</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Team Status</span>
            </div>
            <Badge variant="success">12 online</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Available</span>
                <span className="text-emerald-400 font-medium">9</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>In Meeting</span>
                <span className="text-amber-400 font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>Offline</span>
                <span className="text-slate-400 font-medium">3</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Meetings Today</span>
            </div>
            <Badge variant="primary">3 upcoming</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Scheduled</span>
                <span className="text-white font-medium">5</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Completed</span>
                <span className="text-emerald-400 font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span>Next Meeting</span>
                <span className="text-white font-medium">2:00 PM</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Members */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Team Members</span>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Sarah Johnson', role: 'Engineering Lead', status: 'online', activity: 'Reviewing PR #234' },
              { name: 'Mike Chen', role: 'Senior Developer', status: 'online', activity: 'Working on feature-x' },
              { name: 'Emma Davis', role: 'Designer', status: 'connecting', activity: 'In standup meeting' },
              { name: 'John Smith', role: 'Product Manager', status: 'online', activity: 'Planning sprint' },
              { name: 'Lisa Wang', role: 'Developer', status: 'offline', activity: 'Last seen 2h ago' },
              { name: 'Tom Brown', role: 'DevOps Engineer', status: 'online', activity: 'Deploying to staging' },
            ].map((member, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-all">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0176D3] to-[#014F86] flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <StatusIndicator status={member.status as any} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{member.name}</h3>
                    <p className="text-xs text-slate-400 mb-1">{member.role}</p>
                    <p className="text-xs text-slate-500 truncate">{member.activity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
