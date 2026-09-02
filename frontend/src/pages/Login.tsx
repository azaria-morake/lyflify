import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';
import { SindiLogo, MoloWave } from '@/assets/sindiAssets';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const loginUser = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginUser(email);
      navigate('/');
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/`)
      .then(() => console.log("Server Awake!"))
      .catch(() => console.log("Waking server..."));
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF7F2]">
      
      {/* LEFT SECTION: BRAND & MOLO WAVE HERO */}
      <div className="w-full lg:w-[50%] bg-[#0A7D6F] p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Subtle Decorative Background Shapes */}
        <div className="absolute top-1/4 -left-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-12 w-64 h-64 rounded-full bg-black/10 blur-xl pointer-events-none" />

        {/* Top Header: Logo + App Name */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#FAF7F2] p-1.5 flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
            <img 
              src={SindiLogo} 
              alt="Sindi Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
              Sindi
            </h1>
            <p className="text-white/90 text-sm md:text-base font-medium mt-1">
              Secure Healthcare Portal
            </p>
          </div>
        </div>

        {/* Center Character: Molo Wave with Sparkles & Shapes */}
        <div className="my-8 md:my-12 flex items-center justify-center relative z-10">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            
            {/* Whimsical 4-Point Sparkle Stars */}
            <svg 
              className="absolute -top-2 right-12 w-8 h-8 text-[#FAF7F2]/90 animate-pulse" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            
            <svg 
              className="absolute bottom-20 -left-2 w-10 h-10 text-[#FAF7F2]/80" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>

            <svg 
              className="absolute top-1/3 left-4 w-6 h-6 text-[#FAF7F2]/60" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>

            {/* Playful Floating Dots and Rings */}
            <div className="absolute top-12 left-10 w-4 h-4 rounded-full border-2 border-[#FAF7F2]/80" />
            <div className="absolute top-24 right-4 w-3 h-3 rounded-full bg-[#FAF7F2]/70" />
            <div className="absolute bottom-12 right-12 w-4 h-4 rounded-full border-2 border-[#FAF7F2]/80" />
            <div className="absolute bottom-10 left-16 w-3 h-3 rounded-full bg-[#FAF7F2]" />
            <div className="absolute top-16 right-20 text-[#004D40] text-2xl font-bold font-mono select-none">+</div>
            <div className="absolute bottom-6 left-12 text-[#FAF7F2] text-xl font-bold font-mono select-none">+</div>

            {/* Molo Waving Hand Image */}
            <img 
              src={MoloWave} 
              alt="Molo Waving Hand" 
              className="w-56 sm:w-72 md:w-84 h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Bottom Accent Note */}
        <div className="z-10 text-white/70 text-xs font-medium tracking-wide">
          South Africa's Unified Health Assistant • Powered by Sindi AI
        </div>
      </div>

      {/* RIGHT SECTION: SIGN IN CARD */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 sm:p-10 md:p-16 bg-[#FAF7F2]">
        <div className="w-full max-w-md bg-white rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100/80 p-8 sm:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
              Sign in
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              Enter your clinic or patient credentials
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-12 pr-4 h-12 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 text-base focus-visible:ring-2 focus-visible:ring-[#0A7D6F] focus-visible:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 pr-4 h-12 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 text-base focus-visible:ring-2 focus-visible:ring-[#0A7D6F] focus-visible:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Sindi Red Action Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#E04030] hover:bg-[#c93425] text-white text-base font-bold rounded-xl shadow-md transition-all active:scale-[0.99] mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* DEMO CREDENTIALS BOX (Exactly matching the design) */}
            <div className="mt-8 pt-2">
              <div className="bg-[#F4F5F7] rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 text-center mb-3.5">
                  Demo credentials
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <span>Patient</span>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px] sm:text-xs">
                      user@demo.com
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <span>Doctor</span>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px] sm:text-xs">
                      dr@demo.com
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <span>Admin</span>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px] sm:text-xs">
                      clinic@demo.com
                    </span>
                  </div>
                </div>

                <p className="mt-3.5 pt-2.5 border-t border-slate-200/60 text-center text-[11px] text-slate-500 font-medium">
                  Password for all: <span className="font-semibold text-slate-700">123456</span>
                </p>
              </div>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}