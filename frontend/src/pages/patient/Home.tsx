import { Link, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Activity, Clock, Bot, MapPin, AlertTriangle, UserRound, CalendarClock, Hourglass, Trash2, ChevronRight, ChevronLeft, ArrowRight, XCircle, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const fetchCarePath = async () => {
  const response = await api.get('/navigator/status/demo_user');
  return response.data;
};

export default function PatientHome() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // LOGOUT HOOKS
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['carePath'],
    queryFn: fetchCarePath,
    refetchInterval: 3000, 
  });

  // --- MUTATIONS ---
  const cancelMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "cancel" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carePath'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "delete" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carePath'] })
  });

  // --- SCROLL LOGIC ---
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const hasAppointments = appointments && appointments.length > 0;

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-24 md:pb-6"> {/* Adjusted padding */}
      
      {/* Header */}
      <header className="bg-white p-6 -mx-4 -mt-4 mb-2 border-b shadow-sm md:rounded-xl md:mx-0 md:mt-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sawubona, Gogo</h1>
            <p className="text-slate-500 text-sm">Welcome back to LyfLify</p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* HIDE ON DESKTOP (md:hidden) */}
             <Button variant="ghost" size="icon" onClick={handleLogout} className="md:hidden text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
               <LogOut className="w-5 h-5" />
             </Button>

             <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold border border-teal-200 shadow-sm">
               GD
             </div>
          </div>
        </div>
      </header>

      <div className="space-y-2">
        {/* Navigation Header */}
        <div className="flex justify-between items-center px-1">
          <h3 className="font-semibold text-slate-700">My Appointments</h3>
          {hasAppointments && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('left')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('right')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

{/* --- CAROUSEL CONTAINER --- */}
<div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide"
        >
          
          {/* 1. LOADING SKELETON (Prevents the "Pop-up" effect) */}
          {isLoading && (
             <Card className="min-w-[90%] snap-center shadow-sm border-teal-100/50 bg-white h-[280px] animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="h-6 w-32 bg-slate-100 rounded" />
                    <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                   <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 bg-slate-100 rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-8 w-24 bg-slate-100 rounded" />
                        <div className="h-3 w-32 bg-slate-100 rounded" />
                      </div>
                   </div>
                   <div className="pl-3 border-l-2 border-slate-100 space-y-3">
                      <div className="h-3 w-40 bg-slate-100 rounded" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                   </div>
                   <div className="mt-auto h-10 w-full bg-slate-100 rounded" />
                </CardContent>
             </Card>
          )}

          {/* 2. EMPTY STATE CARD */}
          {(!hasAppointments && !isLoading) && (
            <Card className="min-w-[90%] snap-center p-8 text-center border-dashed border-2 border-slate-200 bg-white/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarClock className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-medium text-slate-900 text-lg">No active appointments</h3>
              <p className="text-slate-500 mb-6 text-sm">Your upcoming clinic visits will appear here.</p>
            </Card>
          )}

          {/* APPOINTMENT CARDS */}
          {appointments?.map((apt: any, i: number) => {
             const isDelayed = apt.status === "Delayed";
             const isUrgent = apt.color_code === "red" && !isDelayed;
             const isPending = apt.status === "Pending Approval";
             const isCancelled = apt.status === "Cancelled";
             const isConfirmed = apt.status === "Confirmed";
             
             // Dynamic Style
             let theme = "border-slate-100 bg-white";
             if (isDelayed) theme = "border-red-200 bg-red-50";
             if (isUrgent) theme = "border-red-200 bg-red-50";
             if (isPending) theme = "border-slate-200 bg-slate-50";
             if (isConfirmed) theme = "border-teal-200 bg-teal-50";
             if (isCancelled) theme = "border-slate-200 bg-slate-100 opacity-90";

             return (
              <Card key={apt.id ||i} className={`min-w-[90%] snap-center shadow-md transition-all duration-500 flex flex-col relative ${theme}`}>
                
                {/* DELETE BUTTON (Top Right) */}
                <div className="absolute top-4 right-4 z-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${isCancelled ? 'text-red-500 hover:text-red-700 hover:bg-red-100' : 'text-slate-300'}`}
                    disabled={!isCancelled} // Only active if Cancelled
                    onClick={() => deleteMutation.mutate(apt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start pr-8"> {/* Padding for delete btn */}
                    <CardTitle className={`text-lg ${isDelayed ? 'text-red-800' : 'text-slate-800'}`}>
                      {isPending ? "Request Sent" : isCancelled ? "Visit Cancelled" : "Current Visit"}
                    </CardTitle>
                    <Badge variant={isDelayed || isUrgent || isCancelled ? 'destructive' : 'secondary'} className={isCancelled ? 'bg-slate-600' : ''}>
                      {apt.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-4">
                  {/* Time & Icon */}
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isDelayed ? 'bg-red-100' : 'bg-white shadow-sm'}`}>
                      {isDelayed ? <AlertTriangle className="w-8 h-8 text-red-600" /> : 
                       isPending ? <Hourglass className="w-8 h-8 text-slate-500" /> :
                       isCancelled ? <XCircle className="w-8 h-8 text-slate-400" /> :
                       <Clock className="w-8 h-8 text-teal-600" />}
                    </div>
                    <div>
                      {isPending ? (
                        <p className="font-semibold text-slate-700 text-lg">Waiting for Approval...</p>
                      ) : isCancelled ? (
                        <p className="font-semibold text-slate-500 text-lg">Booking Removed</p>
                      ) : (
                        <>
                          <p className={`font-bold text-2xl ${isDelayed ? 'text-red-700' : 'text-slate-900'}`}>
                            {apt.estimated_time}
                          </p>
                          <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Estimated Start Time</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Context: Reason & Doctor */}
                  <div className="pl-3 border-l-2 border-slate-300/50 space-y-2">
                      <div className="text-sm">
                        <span className="text-slate-400 text-xs block mb-0.5">Reason for visit</span>
                        <span className="font-medium text-slate-800">{apt.symptoms || "General Checkup"}</span>
                      </div>
                      <div className="text-sm">
                         <span className="text-slate-400 text-xs block mb-0.5">Assigned to</span>
                         <div className="flex items-center font-medium text-slate-700">
                            <UserRound className="w-3 h-3 mr-1 text-slate-400" />
                            Dr. Nkosi ({apt.ticket_score})
                         </div>
                      </div>
                  </div>

                  {/* Bubble Advice */}
                  <div className={`text-xs p-3 rounded-md border flex gap-2 items-start mt-auto
                    ${isDelayed ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-600 border-slate-200'}`
                  }>
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{apt.advice}</span>
                  </div>

                  {/* Cancel Button - Hidden if already cancelled */}
                  {!isCancelled && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 -mb-2"
                      onClick={() => cancelMutation.mutate(apt.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? "Updating..." : "Cancel Appointment"}
                    </Button>
                  )}
                </CardContent>
              </Card>
             );
          })}
        </div>
      </div>

      {/* --- 3. PERSISTENT TRIAGE CTA --- */}
      <div className="bg-white p-6 rounded-xl border shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Feeling Unwell?</h3>
          <p className="text-slate-500 text-sm">Tell us your symptoms before you come to the clinic.</p>
        </div>
        <Link to="/triage" className="block w-full"> 
          <Button size="lg" className="w-full h-12 text-base shadow-teal-900/10 shadow-lg bg-teal-600 hover:bg-teal-700">
            Start Triage Check <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Recent Updates */}
      <div className="space-y-3 pb-4">
        <h3 className="font-semibold text-slate-700 px-1">Recent Updates</h3>
        <div className="bg-white p-4 rounded-xl border flex items-center space-x-3 shadow-sm">
          <div className="bg-blue-50 p-2 rounded-full">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">LyfLify AI Assistant</p>
            <p className="text-xs text-slate-500 truncate">Your blood pressure results are ready...</p>
          </div>
          <span className="text-[10px] text-slate-400">2m ago</span>
        </div>
      </div>
    </div>
  );
}