import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet

export default function ClinicLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Shared Nav Links Component
  const NavLinks = () => (
    <nav className="space-y-1">
      <Link to="/">
        <SidebarItem icon={<LayoutDashboard size={20} />} label="Live Queue" active={location.pathname === "/"} />
      </Link>
      <Link to="/patients">
        <SidebarItem icon={<Users size={20} />} label="Patients" active={location.pathname === "/patients"} />
      </Link>
      <Link to="/analytics">
        <SidebarItem icon={<Activity size={20} />} label="Analytics" active={location.pathname === "/analytics"} />
      </Link>
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Tablet/Mobile) --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col shrink-0 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-white mb-8">
            <Activity className="h-6 w-6 text-teal-400" />
            <span className="font-bold text-xl tracking-tight">LyfLify</span>
          </div>
          <NavLinks />
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium text-red-400 hover:text-red-300 transition-colors w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        
        {/* MOBILE/TABLET HEADER (Visible only on smaller screens) */}
        <header className="lg:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
           <div className="flex items-center gap-2">
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                   <Menu className="w-6 h-6" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="w-64 bg-slate-900 border-r-slate-800 p-0 text-slate-300">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-2 text-white mb-8">
                      <Activity className="h-6 w-6 text-teal-400" />
                      <span className="font-bold text-xl tracking-tight">LyfLify</span>
                    </div>
                    <NavLinks />
                    <div className="mt-auto pt-6 border-t border-slate-800">
                      <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium text-red-400 hover:text-red-300 w-full">
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </div>
               </SheetContent>
             </Sheet>
             <span className="font-bold text-lg tracking-tight">LyfLify</span>
           </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto">
           <Outlet />
        </div>
      </main>
    </div>
  );
}

const SidebarItem = ({ icon, label, active }: { icon: any; label: string; active?: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-md cursor-pointer text-sm font-medium transition-colors",
    active ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"
  )}>
    {icon}
    <span>{label}</span>
  </div>
);