import { Twitter, Linkedin, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function Social() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Social Command Post</h1>
          <p className="text-slate-400 mt-1">
            Multi-platform social media management and automation
          </p>
        </div>
        <Button>Schedule Post</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Twitter */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </div>
            <Badge variant="success">Connected</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Followers</span>
                <span className="text-white font-medium">12.4K</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Posts Today</span>
                <span className="text-white font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>Engagement Rate</span>
                <span className="text-emerald-400 font-medium">4.2%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* LinkedIn */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </div>
            <Badge variant="success">Connected</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Connections</span>
                <span className="text-white font-medium">8.2K</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Posts This Week</span>
                <span className="text-white font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span>Engagement Rate</span>
                <span className="text-emerald-400 font-medium">6.8%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Performance</span>
            </div>
            <Badge variant="primary">This Week</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              <div className="flex justify-between mb-1">
                <span>Total Impressions</span>
                <span className="text-white font-medium">45.2K</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Total Engagement</span>
                <span className="text-white font-medium">2.8K</span>
              </div>
              <div className="flex justify-between">
                <span>Growth</span>
                <span className="text-emerald-400 font-medium">+12%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Calendar */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Content Calendar</span>
            </div>
            <Badge variant="warning">2 drafts</Badge>
          </CardHeader>
          <div className="space-y-3">
            {[
              { platform: 'Twitter', content: 'Excited to announce our new feature...', scheduled: 'Today, 3:00 PM', status: 'scheduled' },
              { platform: 'LinkedIn', content: 'Check out our latest blog post on...', scheduled: 'Tomorrow, 9:00 AM', status: 'scheduled' },
              { platform: 'Twitter', content: 'Thread: How we built our platform...', scheduled: 'Draft', status: 'draft' },
            ].map((post, i) => (
              <div key={i} className="p-4 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-all">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={post.status === 'scheduled' ? 'success' : 'warning'}>
                    {post.platform}
                  </Badge>
                  <span className="text-xs text-slate-400">{post.scheduled}</span>
                </div>
                <p className="text-white text-sm">{post.content}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost">Edit</Button>
                  <Button size="sm" variant="ghost">Preview</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
