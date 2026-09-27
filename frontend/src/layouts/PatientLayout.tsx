import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  SindiLogo, 
  HomeIcon, 
  ChatIcon, 
  ClinicIcon, 
  RecordsIcon,
  ProfileIcon 
} from '@/assets/sindiAssets';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NotificationBell from '@/components/NotificationBell';

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    logout();
    navigate('/login');
  };

  const isChatPage = location.pathname === '/triage';

  return (
    <div className="h-screen bg-[#FAF7F2] flex flex-col overflow-hidden">
      
      {/* --- DESKTOP HEADER --- */}
      <header className="hidden md:flex h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 items-center justify-between px-8 sticky top-0 z-50 shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#0A7D6F]/10 p-1 flex items-center justify-center border border-[#0A7D6F]/20 group-hover:scale-105 transition-transform">
            <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#053B36] font-black text-2xl tracking-tight leading-none">Sindi</span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">Healthcare Portal</span>
          </div>
        </Link>

        <div className="flex items-center gap-6 ml-auto"> 
          <nav className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/60">
            <DesktopNavItem to="/" label="Home" active={isActive('/')} />
            <DesktopNavItem to="/triage" label="Sindi Chat" active={isActive('/triage')} />
            <DesktopNavItem to="/visits" label="Visits" active={isActive('/visits')} />
            <DesktopNavItem to="/notifications" label="Notifications" active={isActive('/notifications')} />
            <DesktopNavItem to="/records" label="My Records" active={isActive('/records')} />
          </nav>

          <div className="h-6 w-px bg-slate-200 mx-1" /> 

          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
              {user?.name || 'Patient'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-slate-500 hover:text-[#E04030] hover:bg-red-50 rounded-full"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full md:max-w-5xl md:mx-auto md:p-6 relative overflow-hidden bg-[#FAF7F2]">
        <div className={cn(
          "h-full w-full max-w-md mx-auto md:max-w-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          isChatPage ? "overflow-hidden pb-0" : "overflow-y-auto pb-24 md:pb-0"
        )}>
           <Outlet />
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV (Matching SINDI_CHAT_V2_dashboard.png) --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <MobileNavItem 
          to="/" 
          label="Home" 
          active={isActive('/')} 
          iconSrc={HomeIcon}
        />
        <MobileNavItem 
          to="/triage" 
          label="Chat" 
          active={isActive('/triage')} 
          iconSrc={ChatIcon}
        />
        <MobileNavItem 
          to="/visits" 
          label="Visits" 
          active={isActive('/visits')} 
          iconSrc={ClinicIcon}
        />
        <MobileNavItem 
          to="/records" 
          label="Records" 
          active={isActive('/records')} 
          iconSrc={RecordsIcon}
        />
        <button 
          onClick={() => setProfileOpen(true)}
          className="flex flex-col items-center justify-center transition-all duration-200 px-3 py-1"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <img 
              src={ProfileIcon} 
              alt="Profile" 
              className="w-5 h-5 object-contain opacity-70 hover:opacity-100" 
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 mt-1">Profile</span>
        </button>
      </nav>

      {/* User Profile Modal on Mobile */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-6 bg-white">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#0A7D6F]/10 border-2 border-[#0A7D6F] mx-auto mb-2 flex items-center justify-center overflow-hidden">
              <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">{user?.name || 'Patient'}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {user?.id || 'Patient Account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="font-bold text-[#0A7D6F]">{user?.role || 'PATIENT'}</span>
              </div>
              <div className="flex justify-between">
                <span>Clinic:</span>
                <span className="font-medium">Sindi Community Care</span>
              </div>
            </div>

            <Button 
              onClick={handleLogout}
              className="w-full bg-[#E04030] hover:bg-[#c93425] text-white rounded-xl text-sm font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

const MobileNavItem = ({ to, label, active, iconSrc }: { to: string; label: string; active: boolean; iconSrc: string }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center transition-all duration-200 px-3 py-1 relative",
      active ? "text-[#0A7D6F]" : "text-slate-400 hover:text-slate-600"
    )}
  >
    <div className="w-6 h-6 flex items-center justify-center">
      <img 
        src={iconSrc} 
        alt={label} 
        className={cn("w-5 h-5 object-contain transition-transform", active ? "scale-110" : "opacity-75")} 
      />
    </div>
    <span className={cn("text-[10px] font-semibold mt-1", active ? "text-[#0A7D6F]" : "text-slate-500")}>
      {label}
    </span>
    {active && (
      <span className="w-1.5 h-1.5 rounded-full bg-[#0A7D6F] absolute -bottom-1" />
    )}
  </Link>
);

const DesktopNavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
      active ? "bg-white text-[#0A7D6F] shadow-sm" : "text-slate-500 hover:text-slate-900"
    )}
  >
    {label}
  </Link>
);