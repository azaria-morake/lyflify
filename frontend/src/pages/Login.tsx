import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Activity, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setStoreUser = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Determine Role (For Hackathon Demo purposes)
      // In a real app, this role would come from a database query or custom claim.
      // Here we cheat slightly for the demo: "dr" in email = PROVIDER.
      let role: 'PATIENT' | 'PROVIDER' = 'PATIENT';
      let name = "Thabo"; // Default demo name

      if (email.includes('dr') || email.includes('clinic')) {
        role = 'PROVIDER';
        name = "Dr. Zulu";
      }

      // 3. Update Global Store
      setStoreUser(role); // This updates Zustand
      
      // 4. Redirect
      navigate('/');
      
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-teal-600 p-3 rounded-2xl shadow-lg shadow-teal-900/20 mb-2">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">LyfLify</h1>
          <p className="text-slate-500 font-medium">Secure Healthcare Portal</p>
        </div>

        <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your clinic or patient credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-9 bg-slate-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-9 bg-slate-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* HACKATHON HELPER HINT */}
              <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 text-center border border-slate-100">
                <p className="font-semibold mb-1">Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block font-bold text-slate-700">Patient</span>
                    user@demo.com / 123456
                  </div>
                  <div>
                    <span className="block font-bold text-slate-700">Doctor</span>
                    dr@demo.com / 123456
                  </div>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
      
      <p className="absolute bottom-6 text-xs text-slate-400 font-medium">© 2024 LyfLify Health • Secured by Firebase</p>
    </div>
  );
}