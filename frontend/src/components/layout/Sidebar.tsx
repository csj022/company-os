import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Code,
  Palette,
  Users,
  Share2,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Plug,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';

const navigation = [
  { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Development', href: '/development', icon: Code },
  { name: 'Dev Hub', href: '/development-hub', icon: GitBranch },
  { name: 'Design System', href: '/design', icon: Palette },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Social', href: '/social', icon: Share2 },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Intelligence', href: '/intelligence', icon: Brain },
  { name: 'Integrations', href: '/integrations', icon: Plug },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#1A1F28] border-r border-[#3A4352] transition-all duration-300 flex flex-col z-40',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#3A4352]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0176D3] to-[#014F86] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CO</span>
            </div>
            <span className="font-bold text-white">Company OS</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0176D3] to-[#014F86] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">CO</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[#0176D3] text-white shadow-lg shadow-salesforce-blue/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#232931]'
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[#3A4352]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#232931] transition-all"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
