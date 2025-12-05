import { Outlet, useNavigate } from 'react-router-dom'; // Added useNavigate
import { LayoutDashboard, Users, Activity, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

export default function ClinicLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate(); // Hook for redirection

  const handleLogout = () => {
    logout();
    navigate('/login'); // Force redirect
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-white mb-8">
            <Activity className="h-6 w-6 text-teal-400" />
            <span className="font-bold text-xl tracking-tight">LyfLify</span>
          </div>
          <nav className="space-y-1">
            <Link to="/">
              <SidebarItem icon={<LayoutDashboard size={20} />} label="Live Queue" active={location.pathname === "/"} />
            </Link>
            
            {/* "Patients" is a placeholder for now */}
            <SidebarItem icon={<Users size={20} />} label="Patients" />
            
            <Link to="/analytics">
              <SidebarItem icon={<Activity size={20} />} label="Analytics" active={location.pathname === "/analytics"} />
            </Link>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout} // Use the new handler
            className="flex items-center gap-3 text-sm font-medium text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

// Simple Helper Component for Sidebar Items
const SidebarItem = ({ icon, label, active }: { icon: any; label: string; active?: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm font-medium transition-colors",
    active 
      ? "bg-slate-800 text-white" 
      : "hover:bg-slate-800 hover:text-white"
  )}>
    {icon}
    <span>{label}</span>
  </div>
);