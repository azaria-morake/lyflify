import { Activity, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';

export default function Login() {
  const login = useAuthStore((state) => state.login);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

      {/* Brand Header */}
      <div className="text-center mb-12 z-10 space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="bg-teal-600 p-3 rounded-2xl shadow-lg shadow-teal-900/20">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">LyfLify</h1>
        </div>
        <p className="text-xl text-slate-500 font-medium tracking-wide">Connecting Communities to Care</p>
      </div>

      {/* The Demo Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl z-10">
        
        {/* Patient Entry */}
        <Card 
          className="hover:shadow-xl hover:border-teal-200 transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm" 
          onClick={() => login('PATIENT')}
        >
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300 border border-teal-100">
              <User className="w-10 h-10 text-teal-600" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">Patient Access</CardTitle>
              <CardDescription>Mobile Optimized View</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Button className="w-full h-12 text-base shadow-md shadow-teal-900/5 bg-teal-600 hover:bg-teal-700">
              Login as Thabo
            </Button>
          </CardContent>
        </Card>

        {/* Provider Entry */}
        <Card 
          className="hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm"
          onClick={() => login('PROVIDER')}
        >
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300 border border-slate-100">
              <Stethoscope className="w-10 h-10 text-slate-700" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">Clinic Portal</CardTitle>
              <CardDescription>Desktop Dashboard</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" className="w-full h-12 text-base border-slate-200 hover:bg-slate-50 hover:text-slate-900">
              Login as Dr. Zulu
            </Button>
          </CardContent>
        </Card>

      </div>
      
      <p className="absolute bottom-6 text-xs text-slate-400 font-medium">© 2024 LyfLify Health • Hackathon Prototype v0.1</p>
    </div>
  );
}