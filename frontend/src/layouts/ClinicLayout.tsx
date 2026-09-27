import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, LogOut, Menu, Inbox } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SindiLogo } from '@/assets/sindiAssets';

export default function ClinicLayout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "queue"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter(doc => doc.data().status === 'Pending Approval').length;
      setPendingCount(count);
    }, (error) => {
      console.error("ClinicLayout queue listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    logout();
    navigate('/login');
  };

  // Shared Nav Links Component
  const NavLinks = () => (
    <nav className="space-y-1.5">
      <Link to="/">
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Live Queue" 
          active={location.pathname === "/"} 
        />
      </Link>
      <Link to="/booking-requests">
        <SidebarItem 
          icon={<Inbox size={20} />} 
          label="Booking Requests" 
          active={location.pathname === "/booking-requests"} 
          badge={pendingCount}
        />
      </Link>
      <Link to="/patients">
        <SidebarItem 
          icon={<Users size={20} />} 
          label="Patients" 
          active={location.pathname === "/patients"} 
        />
      </Link>
      <Link to="/analytics">
        <SidebarItem 
          icon={<Activity size={20} />} 
          label="Analytics" 
          active={location.pathname === "/analytics"} 
        />
      </Link>
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Tablet/Mobile) --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col shrink-0 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center space-x-3 text-white mb-8">
            <div className="w-9 h-9 rounded-full bg-[#0A7D6F] p-1 flex items-center justify-center border border-teal-400/40">
              <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block leading-none">Sindi</span>
              <span className="text-[10px] text-teal-400 uppercase tracking-widest font-semibold">Clinic Portal</span>
            </div>
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
                    <div className="flex items-center space-x-3 text-white mb-8">
                      <div className="w-8 h-8 rounded-full bg-[#0A7D6F] p-1 flex items-center justify-center border border-teal-400/40">
                        <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
                      </div>
                      <span className="font-extrabold text-xl tracking-tight">Sindi</span>
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
             <div className="flex items-center gap-2">
               <div className="w-7 h-7 rounded-full bg-[#0A7D6F] p-0.5 flex items-center justify-center">
                 <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
               </div>
               <span className="font-bold text-lg tracking-tight">Sindi</span>
             </div>
           </div>

           <div className="flex items-center gap-2">
             {pendingCount > 0 && (
               <Link 
                 to="/booking-requests"
                 className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold"
               >
                 <Inbox className="w-3.5 h-3.5" />
                 <span>{pendingCount}</span>
               </Link>
             )}
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

const SidebarItem = ({ 
  icon, 
  label, 
  active, 
  badge 
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  badge?: number;
}) => (
  <div className={cn(
    "flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-medium transition-all",
    active 
      ? "bg-[#0A7D6F] text-white shadow-sm font-semibold" 
      : "text-slate-400 hover:bg-slate-800 hover:text-white"
  )}>
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="bg-amber-500 text-slate-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
        {badge}
      </span>
    )}
  </div>
);