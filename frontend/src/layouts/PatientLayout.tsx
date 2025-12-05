import { Outlet, useLocation, Link } from 'react-router-dom';
import { MessageCircle, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatientLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    // FIX: Changed h-screen to h-[100dvh] for mobile browsers
    <div className="flex flex-col h-[100dvh] bg-slate-50 w-full max-w-md mx-auto border-x border-slate-200 shadow-xl relative overflow-hidden">
      
      {/* Main Scrollable Content */}
      {/* FIX: pb-20 ensures content is never hidden behind the nav */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        <Outlet />
      </main>

      {/* Sticky Bottom Nav */}
      {/* FIX: Changed to 'absolute bottom-0' with a high z-index and border-t for separation */}
      <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-400 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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