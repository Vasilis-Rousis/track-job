import { useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Briefcase, LayoutDashboard, Users, Mail, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { getInitials } from '@/utils/helpers';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/applications': 'Applications',
  '/contacts': 'Contacts',
  '/emails': 'Emails',
  '/settings': 'Settings',
};

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: Briefcase, end: false },
  { to: '/contacts', label: 'Contacts', icon: Users, end: false },
  { to: '/emails', label: 'Emails', icon: Mail, end: false },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/applications/') ? 'Application Detail' : 'JobTracker');

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearUser();
    navigate('/login');
  };

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="font-bold">JobTracker</span>
        </div>
        <span className="text-muted-foreground">/ {pageTitle}</span>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="font-bold">JobTracker</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { navigate('/settings'); setOpen(false); }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                  </div>
                </button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
