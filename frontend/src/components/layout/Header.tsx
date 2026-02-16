import { Bell, Search, Settings, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

export function Header() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-[#1A1F28] border-b border-[#3A4352] transition-all duration-300 z-30',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Company OS..."
              className="w-full pl-10 pr-4 py-2 bg-[#232931] border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0176D3] focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-6">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-[#232931] rounded-lg transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-slate-400 hover:text-white hover:bg-[#232931] rounded-lg transition-all">
            <Settings className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center gap-3 pl-3 pr-4 py-2 hover:bg-[#232931] rounded-lg transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0176D3] to-[#014F86] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
                <div className="text-xs text-slate-400">{user?.role || 'Member'}</div>
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1F28] border border-[#3A4352] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#232931] rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
