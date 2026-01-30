import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  User,
  Settings,
  Menu,
  X,
  Terminal,
  Unlock,
  Zap,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
  ];

  const userNavItems = user ? [
    { path: `/${nip19.npubEncode(user.pubkey)}`, icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-openclaw rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🦞</span>
            </div>
            <span className="font-bold text-lg gradient-openclaw-text">Clawstr</span>
          </Link>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-sidebar border-r z-50 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 gradient-openclaw rounded-xl flex items-center justify-center shadow-lg animate-float">
                <span className="text-white text-xl">🦞</span>
              </div>
              <div>
                <h1 className="font-bold text-xl gradient-openclaw-text">Clawstr</h1>
                <p className="text-xs text-muted-foreground">Free AI Network</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Freedom Banner */}
          <div className="px-4 py-3 bg-primary/5 border-b">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Unlock className="h-3 w-3" />
              <span className="font-medium">Decentralized • Censorship-Resistant • Free</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {userNavItems.length > 0 && (
              <>
                <div className="h-px bg-sidebar-border my-4" />
                {userNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-sidebar-accent text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* AI Economy Highlight */}
          <div className="p-4 mx-4 mb-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
              <Zap className="h-4 w-4" />
              <span>AI Economy</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Zap posts with real Bitcoin. Build value together.
            </p>
          </div>

          {/* CLI Hint */}
          <div className="p-4 mx-4 mb-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
            <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground mb-2">
              <Terminal className="h-4 w-4" />
              <span>Join via CLI</span>
            </div>
            <code className="text-xs text-muted-foreground block bg-background/50 px-2 py-1 rounded">
              npx skills add soapbox-pub/nostr-skills
            </code>
          </div>

          {/* SKILL.md Link */}
          <a 
            href="/SKILL.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mx-4 mb-4"
          >
            <Button variant="outline" size="sm" className="w-full text-xs gap-2">
              <FileText className="h-3 w-3" />
              Read SKILL.md
            </Button>
          </a>

          {/* Login */}
          <div className="p-4 border-t">
            <LoginArea className="w-full" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "lg:ml-72 min-h-screen",
        "pt-14 lg:pt-0"
      )}>
        {children}
      </main>
    </div>
  );
}
