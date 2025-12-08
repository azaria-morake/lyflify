import { Link, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { 
  Activity, Clock, Bot, MapPin, AlertTriangle, UserRound, CalendarClock, 
  Hourglass, Trash2, ChevronRight, ChevronLeft, ArrowRight, XCircle, LogOut, FileText, Sparkles, HeartPulse, BrainCircuit
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ServerStatus } from '@/components/custom/ServerStatus';

// ... (Keep existing MetaLogo and fetchers) ...
// --- CUSTOM META ICON COMPONENT ---
const MetaLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 5.16514C9.65665 5.16514 8.2128 6.69714 7.22813 8.35824L6.99343 8.75166C6.56477 9.47566 6.13611 10.1979 5.62939 10.7937C4.95357 11.5833 4.2096 11.9566 3.4259 11.9566C2.19329 11.9566 1.34119 10.9577 1.34119 9.38799C1.34119 7.8596 2.15243 6.87714 3.32711 6.87714C3.89669 6.87714 4.39893 7.14798 4.7176 7.61914L4.99127 8.02514C5.16662 8.28564 5.51206 8.35224 5.77256 8.17688C6.03306 8.00153 6.09966 7.65609 5.9243 7.39559L5.65063 6.98959C5.1378 6.22839 4.32074 5.76024 3.32711 5.76024C1.5037 5.76024 0.224121 7.33714 0.224121 9.38799C0.224121 11.5851 1.62319 13.0737 3.4259 13.0737C4.69733 13.0737 5.63206 12.4283 6.47539 11.4397C6.9188 10.9202 7.30937 10.2611 7.69733 9.60539C7.75893 9.50139 7.82053 9.39739 7.88106 9.29453L7.96263 9.15739C8.75223 7.82399 9.77133 6.84139 11.3789 6.84139C13.2373 6.84139 14.2872 8.13999 14.8965 9.77339L15.3365 10.9502C15.8645 12.3662 16.7925 13.0737 18.2565 13.0737C20.4072 13.0737 21.7325 11.3265 21.7325 9.38799C21.7325 7.42624 20.3725 5.76024 18.2565 5.76024C16.6365 5.76024 15.5125 6.55024 14.5379 8.23024L14.4725 8.34359L14.3992 8.53959C14.2565 8.92224 13.7312 10.3277 12.556 10.3277C11.3411 10.3277 10.5181 9.27339 10.0248 8.04399L9.58479 6.94539C8.83413 5.07478 10.2741 5.16514 12 5.16514ZM18.2565 6.87714C19.6739 6.87714 20.6155 8.04139 20.6155 9.38799C20.6155 10.712 19.6979 11.9566 18.2565 11.9566C17.3712 11.9566 16.7645 11.5311 16.3805 10.5594L16.2739 10.2728C17.0605 8.20453 17.1592 8.06999 17.2912 7.84339C17.6325 7.25624 17.8845 6.87714 18.2565 6.87714Z" />
  </svg>
);

const fetchCarePath = async () => {
  const response = await api.get('/navigator/status/demo_user');
  return response.data;
};

const fetchRecentRecord = async () => {
  const response = await api.get('/records/list/demo_user');
  return response.data && response.data.length > 0 ? response.data[0] : null;
};

const fetchHealthPulse = async () => {
  const response = await api.get('/records/ai-summary/demo_user');
  return response.data;
};

export default function PatientHome() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const { data: latestRecord } = useQuery({
    queryKey: ['latestRecord'],
    queryFn: fetchRecentRecord,
    refetchInterval: 5000,
  });

  const { data: aiPulse, isLoading: loadingAi } = useQuery({
    queryKey: ['aiPulse'],
    queryFn: fetchHealthPulse,
  });

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const hasAppointments = appointments && appointments.length > 0;

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-24 md:pb-6">
      {/* Header */}
      <header className="bg-white p-6 -mx-4 -mt-4 mb-2 border-b shadow-sm md:rounded-xl md:mx-0 md:mt-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sawubona, Gogo</h1>
            <p className="text-slate-500 text-sm">Welcome back to LyfLify</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={handleLogout} className="md:hidden text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
               <LogOut className="w-5 h-5" />
             </Button>
             <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold border border-teal-200 shadow-sm">GD</div>
          </div>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-semibold text-slate-700">My Appointments</h3>
          {hasAppointments && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('left')}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('right')}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
          
          {isLoading && (
             <div className="min-w-[90%] md:w-full snap-center">
                <ServerStatus />
             </div>
          )}

          {(!hasAppointments && !isLoading) && (
            <Card className="min-w-[90%] md:w-full snap-center p-8 text-center border-dashed border-2 border-slate-200 bg-white/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarClock className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-medium text-slate-900 text-lg">No active appointments</h3>
              <p className="text-slate-500 mb-6 text-sm">Your upcoming clinic visits will appear here.</p>
            </Card>
          )}

          {appointments?.map((apt: any, i: number) => {
             const isDelayed = apt.status === "Delayed";
             const isUrgent = apt.color_code === "red" && !isDelayed;
             const isPending = apt.status === "Pending Approval";
             const isCancelled = apt.status === "Cancelled";
             const isConfirmed = apt.status === "Confirmed";
             
             let theme = "border-slate-100 bg-white";
             if (isDelayed) theme = "border-red-200 bg-red-50";
             if (isUrgent) theme = "border-red-200 bg-red-50";
             if (isPending) theme = "border-slate-200 bg-slate-50";
             if (isConfirmed) theme = "border-teal-200 bg-teal-50";
             if (isCancelled) theme = "border-slate-200 bg-slate-100 opacity-90";

             return (
              <Card key={apt.id || i} className={`min-w-[90%] md:w-full snap-center shadow-md transition-all duration-500 flex flex-col relative md:min-w-0 md:snap-align-none ${theme}`}>
                <div className="absolute top-4 right-4 z-10">
                  <Button variant="ghost" size="icon" className={`h-8 w-8 ${isCancelled ? 'text-red-500 hover:text-red-700 hover:bg-red-100' : 'text-slate-300'}`} disabled={!isCancelled} onClick={() => deleteMutation.mutate(apt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start pr-8">
                    <CardTitle className={`text-lg ${isDelayed ? 'text-red-800' : 'text-slate-800'}`}>
                      {isPending ? "Request Sent" : isCancelled ? "Visit Cancelled" : "Current Visit"}
                    </CardTitle>
                    <Badge variant={isDelayed || isUrgent || isCancelled ? 'destructive' : 'secondary'} className={isCancelled ? 'bg-slate-600' : ''}>
                      {apt.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isDelayed ? 'bg-red-100' : 'bg-white shadow-sm'}`}>
                      {isDelayed ? <AlertTriangle className="w-8 h-8 text-red-600" /> : 
                       isPending ? <Hourglass className="w-8 h-8 text-slate-500" /> :
                       isCancelled ? <XCircle className="w-8 h-8 text-slate-400" /> :
                       <Clock className="w-8 h-8 text-teal-600" />}
                    </div>
                    <div>
                      {isPending ? (
                        <div className="flex flex-col">
                          <p className="font-semibold text-slate-700 text-lg">Waiting for Approval...</p>
                          <div className="flex items-center gap-1.5 mt-1 bg-teal-50 px-2 py-0.5 rounded text-xs text-teal-700 font-medium w-fit">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            Live Queue: #{i + 1 + 2}
                          </div>
                        </div>
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

                  <div className={`text-xs p-3 rounded-md border flex gap-2 items-start mt-auto ${isDelayed ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{apt.advice}</span>
                  </div>

                  {!isCancelled && (
                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 -mb-2" onClick={() => cancelMutation.mutate(apt.id)} disabled={cancelMutation.isPending}>
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

      {/* --- AI HEALTH PULSE CARD --- */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-700 px-1 flex items-center gap-3">
          <div className="flex items-center">
            <div className="bg-teal-600 p-1.5 rounded-full z-10 ring-2 ring-white shadow-sm">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <div className="bg-blue-600 p-1.5 rounded-full -ml-2 ring-2 ring-white shadow-sm">
              <BrainCircuit className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <span className="font-bold text-sm md:text-base bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-blue-700">
            LyfLify Llama 3 Health Pulse
          </span>
        </h3>

        {loadingAi ? (
          <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 animate-pulse h-32" />
        ) : (
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 rounded-xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white mb-2 uppercase tracking-wide">
                  Analysis Complete
                </span>
                <h4 className="text-lg font-bold flex items-center gap-2">
                  Status: {aiPulse?.status}
                </h4>
              </div>
              <HeartPulse className="w-8 h-8 text-indigo-200 opacity-80" />
            </div>
            
            <p className="mt-2 text-indigo-50 text-sm leading-relaxed">
              "{aiPulse?.summary}"
            </p>
            
            <div className="mt-4 pt-3 border-t border-white/20 flex items-start gap-2">
              <span className="bg-white/20 p-1 rounded-full"><Bot className="w-3 h-3" /></span>
              <p className="text-xs text-indigo-100 font-medium italic">Tip: {aiPulse?.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Updates */}
      <div className="space-y-3 pb-4">
        <h3 className="font-semibold text-slate-700 px-1">Recent Updates</h3>
        {latestRecord ? (
          <div className="bg-white p-4 rounded-xl border flex items-center space-x-3 shadow-sm cursor-pointer hover:border-teal-200 transition-colors" onClick={() => navigate('/records')}>
            <div className="bg-blue-50 p-2 rounded-full">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">
                New Health Record Added
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">NEW</span>
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {latestRecord.diagnosis} • Treated by {latestRecord.doctor}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{latestRecord.date}</span>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border flex items-center space-x-3 shadow-sm opacity-60">
            <div className="bg-slate-50 p-2 rounded-full">
              <Bot className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">LyfLify Assistant</p>
              <p className="text-xs text-slate-500">No recent medical updates found.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}