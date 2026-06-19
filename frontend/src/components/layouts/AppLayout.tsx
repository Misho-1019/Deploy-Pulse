import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import ThemeToggle from '../ThemeToggle';
import { Menu, X } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/app" className="text-xl font-bold">
            DeployPulse
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/app/settings" className="text-sm text-muted-foreground hover:text-foreground">Settings</Link>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t px-4 py-3 space-y-3 bg-card">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Link to="/app/settings" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground">Settings</Link>
            <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-muted-foreground">Sign out</button>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
