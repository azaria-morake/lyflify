import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, MessageCircle, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PatientLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full max-w-md mx-auto border-x border-slate-200 shadow-xl relative">
      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Sticky Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-white border-t px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-400 z-50">
        <NavItem to="/" icon={<User className="w-5 h-5" />} label="Home" active={isActive('/')} />
        <NavItem to="/triage" icon={<MessageCircle className="w-5 h-5" />} label="Chat" active={isActive('/triage')} />
        <NavItem to="/records" icon={<FileText className="w-5 h-5" />} label="Records" active={isActive('/records')} />
      </nav>
    </div>
  );
}

const NavItem = ({ to, icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link to={to} className={cn("flex flex-col items-center space-y-1 transition-colors", active ? "text-teal-600" : "hover:text-teal-600")}>
    <div className={cn("px-4 py-1 rounded-full", active ? "bg-teal-50" : "")}>
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
    </div>
    <span>{label}</span>
  </Link>
);