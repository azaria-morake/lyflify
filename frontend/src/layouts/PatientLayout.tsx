import { Outlet, useLocation, Link } from 'react-router-dom';
import { MessageCircle, FileText, User, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export default function PatientLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const logout = useAuthStore((state) => state.logout);

  // DETECT CHAT PAGE
  const isChatPage = location.pathname === '/triage';

  return (
    // ROOT: Lock viewport height (h-screen) and hide overflow to prevent body scroll
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      
      {/* --- DESKTOP HEADER --- */}
      <header className="hidden md:flex h-16 bg-white border-b items-center justify-between px-8 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="w-6 h-6" />
          <span>LyfLify</span>
        </div>

        <div className="flex items-center gap-6 ml-auto"> 
          <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-full">
            <DesktopNavItem to="/" label="Home" active={isActive('/')} />
            <DesktopNavItem to="/triage" label="Triage Chat" active={isActive('/triage')} />
            <DesktopNavItem to="/records" label="Medical Records" active={isActive('/records')} />
          </nav>

          <div className="h-6 w-px bg-slate-200 mx-2" /> 

          <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full md:max-w-5xl md:mx-auto md:p-6 relative overflow-hidden">
        {/* WRAPPER LOGIC:
           - Normal Pages: Scrollable (overflow-y-auto) with bottom padding (pb-24) for the nav.
           - Chat Page: Non-scrollable (overflow-hidden) with NO padding. The Chat component handles its own layout.
        */}
        <div className={cn(
          "h-full w-full max-w-md mx-auto md:max-w-none bg-slate-50 md:bg-transparent",
          isChatPage ? "overflow-hidden pb-0" : "overflow-y-auto pb-24 md:pb-0"
        )}>
           <Outlet />
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-400 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavItem to="/" icon={<User className="w-5 h-5" />} label="Home" active={isActive('/')} />
        <NavItem to="/triage" icon={<MessageCircle className="w-5 h-5" />} label="Chat" active={isActive('/triage')} />
        <NavItem to="/records" icon={<FileText className="w-5 h-5" />} label="Records" active={isActive('/records')} />
      </nav>
    </div>
  );
}

const NavItem = ({ to, icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link to={to} className={cn("flex flex-col items-center space-y-1 transition-all duration-300", active ? "text-teal-600 scale-105" : "hover:text-teal-600")}>
    <div className={cn("px-5 py-1.5 rounded-full transition-colors", active ? "bg-teal-50" : "bg-transparent")}>
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
    </div>
    <span className="text-[10px] font-semibold">{label}</span>
  </Link>
);

const DesktopNavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
      active ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
    )}
  >
    {label}
  </Link>
);