import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Mail,
  LogOut,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { getInitials } from '@/utils/helpers';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: Briefcase, end: false },
  { to: '/contacts', label: 'Contacts', icon: Users, end: false },
  { to: '/emails', label: 'Emails', icon: Mail, end: false },
];

const adminNavItem = { to: '/admin', label: 'Admin', icon: Shield, end: false };

export function Sidebar() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearUser();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Briefcase className="mr-2 h-6 w-6 text-primary" />
        <span className="text-xl font-bold">JobTracker</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-4">
        {[...navItems, ...(user?.role === 'ADMIN' ? [adminNavItem] : [])].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 hover:bg-accent"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
