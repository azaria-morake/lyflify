import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  ChevronRight, ArrowRight, Clock, AlertTriangle, 
  Trash2, XCircle, Hourglass, HeartPulse, Sparkles,
  CheckCircle2, Pill, Activity, Bot
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  SindiLogo, 
  ChatIcon, 
  BookClinicIcon, 
  RecordsIcon, 
  HealthTipsIcon, 
  QueueIcon 
} from '@/assets/sindiAssets';
import NotificationBell from '@/components/NotificationBell';

// --- FETCHERS ---
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
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [healthTipsOpen, setHealthTipsOpen] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);

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

  const activeApt = appointments && appointments.length > 0 ? appointments[0] : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#FAF7F2] min-h-screen pb-28 md:pb-8">
      
      {/* 1. TOP HEADER: SINDI CHAT (Exact match with SINDI_CHAT_V2_dashboard.png) */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0A7D6F] p-1 flex items-center justify-center shrink-0 shadow-md border-2 border-white">
            <img 
              src={SindiLogo} 
              alt="Sindi" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#053B36] tracking-tight uppercase leading-none">
              SINDI CHAT
            </h1>
          </div>
        </div>
        <NotificationBell className="w-11 h-11 bg-white shadow-sm border border-slate-200" />
      </div>

      {/* 2. GREETING */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Molo, {user?.name?.split(' ')[0] || "Thandi"}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          How can we help you today?
        </p>
      </div>

      {/* 3. HERO ACTION CARD: "Talk to Sindi" (Exact match) */}
      <div 
        onClick={() => navigate('/triage')}
        className="bg-[#0A7D6F] hover:bg-[#086b5e] rounded-[24px] p-5 flex items-center justify-between text-white cursor-pointer shadow-[0_10px_25px_rgba(10,125,111,0.25)] transition-all transform active:scale-[0.99] group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
            <img 
              src={ChatIcon} 
              alt="Chat" 
              className="w-8 h-8 object-contain drop-shadow" 
            />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-snug">
              Talk to Sindi
            </h3>
            <p className="text-white/80 text-xs mt-0.5 font-medium">
              Ask health questions • 24/7 available
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 4. QUICK ACTIONS (2x2 Grid, matching SINDI_CHAT_V2_dashboard.png) */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-slate-900 tracking-tight">
          Quick actions
        </h3>

        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Action 1: Book Clinic */}
          <div 
            onClick={() => navigate('/triage')}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-md hover:border-[#0A7D6F]/30 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5F3] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <img 
                src={BookClinicIcon} 
                alt="Book Clinic" 
                className="w-9 h-9 object-contain" 
              />
            </div>
            <span className="font-bold text-sm text-slate-800">
              Book Clinic
            </span>
          </div>

          {/* Action 2: My Records */}
          <div 
            onClick={() => navigate('/records')}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-md hover:border-[#0A7D6F]/30 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5F3] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <img 
                src={RecordsIcon} 
                alt="My Records" 
                className="w-9 h-9 object-contain" 
              />
            </div>
            <span className="font-bold text-sm text-slate-800">
              My Records
            </span>
          </div>

          {/* Action 3: Health Tips */}
          <div 
            onClick={() => setHealthTipsOpen(true)}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-md hover:border-[#0A7D6F]/30 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5F3] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <img 
                src={HealthTipsIcon} 
                alt="Health Tips" 
                className="w-9 h-9 object-contain" 
              />
            </div>
            <span className="font-bold text-sm text-slate-800">
              Health Tips
            </span>
          </div>

          {/* Action 4: Queue Status */}
          <div 
            onClick={() => setQueueModalOpen(true)}
            className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-md hover:border-[#0A7D6F]/30 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EAF5F3] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <img 
                src={QueueIcon} 
                alt="Queue Status" 
                className="w-9 h-9 object-contain" 
              />
            </div>
            <span className="font-bold text-sm text-slate-800">
              Queue Status
            </span>
            <span className="text-[11px] font-semibold text-[#0A7D6F] mt-0.5">
              {activeApt ? `${activeApt.status} • ${activeApt.estimated_time || "~10 min"}` : "2 ahead • ~10 min"}
            </span>
          </div>

        </div>
      </div>

      {/* 5. ACTIVE APPOINTMENT ALERT (If patient has active visit) */}
      {activeApt && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0A7D6F]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#0A7D6F]" />
              </div>
              <span className="font-bold text-sm text-slate-800">Active Clinic Visit</span>
            </div>
            <Badge 
              variant={activeApt.status === "Delayed" ? "destructive" : "secondary"}
              className={activeApt.status === "Confirmed" ? "bg-[#0A7D6F] text-white" : ""}
            >
              {activeApt.status}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Estimated Start Time</p>
              <p className="text-2xl font-black text-slate-900">{activeApt.estimated_time || "10:30 AM"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase">Reason</p>
              <p className="text-sm font-bold text-slate-700">{activeApt.symptoms || "General Checkup"}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <span className="font-bold text-[#0A7D6F]">Clinic Advice:</span>
            <span>{activeApt.advice || "Please take a seat in the waiting hall."}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
              onClick={() => cancelMutation.mutate(activeApt.id)}
              disabled={cancelMutation.isPending}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      )}

      {/* 6. RECENT CHATS (Matching SINDI_CHAT_V2_dashboard.png) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 tracking-tight">
            Recent chats
          </h3>
          <button 
            onClick={() => navigate('/records')}
            className="text-xs font-bold text-[#0A7D6F] flex items-center hover:underline"
          >
            See all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          
          {/* Row 1: Doctor Consultation */}
          <div 
            onClick={() => navigate('/records')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#0A7D6F] flex items-center justify-center shrink-0 shadow-sm border border-teal-200">
                {/* Doctor Avatar */}
                <div className="w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#0A7D6F] font-bold text-xs">
                  👨‍⚕️
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Consultation with Dr. Nkosi
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {latestRecord ? `Diagnosis: ${latestRecord.diagnosis}` : "You: Thanks, I will take the medication"}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap pl-2">
              10:32 AM
            </span>
          </div>

          {/* Row 2: Prescription Follow-up */}
          <div 
            onClick={() => navigate('/records')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#0A7D6F] flex items-center justify-center shrink-0 shadow-sm text-white">
                <Pill className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Prescription Follow-up
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  Reminder: Take 1 tablet after meals
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap pl-2">
              Yesterday
            </span>
          </div>

          {/* Row 3: Lab Results Ready */}
          <div 
            onClick={() => navigate('/records')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#0A7D6F] flex items-center justify-center shrink-0 shadow-sm text-white">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Lab Results Ready
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  Your bloodwork is now available to view
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap pl-2">
              14 Oct
            </span>
          </div>

        </div>
      </div>

      {/* HEALTH TIPS DIALOG (Sindi AI Pulse) */}
      <Dialog open={healthTipsOpen} onOpenChange={setHealthTipsOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-6 bg-white border border-slate-100">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#0A7D6F]/10 flex items-center justify-center mb-2">
              <img src={HealthTipsIcon} alt="Health" className="w-8 h-8 object-contain" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#053B36]">
              Sindi Health Tips & Pulse
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Personalized AI health insights based on your medical records
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A7D6F]">
                  Analysis Status
                </span>
                <Badge className="bg-[#0A7D6F] text-white text-[10px]">
                  {aiPulse?.status || "Stable"}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                "{aiPulse?.summary || "Your records show recovery progress. Remember to follow your medication timing and stay hydrated."}"
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">Sindi's Daily Recommendation</p>
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  {aiPulse?.tip || "Drink at least 2 litres of water today and rest if you feel fatigue."}
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setHealthTipsOpen(false)}
              className="w-full bg-[#0A7D6F] hover:bg-[#086b5e] text-white rounded-xl font-bold"
            >
              Thank you, Sindi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QUEUE STATUS MODAL */}
      <Dialog open={queueModalOpen} onOpenChange={setQueueModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-6 bg-white border border-slate-100">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#0A7D6F]/10 flex items-center justify-center mb-2">
              <img src={QueueIcon} alt="Queue" className="w-8 h-8 object-contain" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#053B36]">
              Live Clinic Queue Status
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Real-time waiting time and queue position at Sindi Community Clinic
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="bg-[#FAF7F2] p-5 rounded-2xl text-center space-y-2 border border-slate-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Queue Position</span>
              <div className="text-4xl font-black text-[#0A7D6F]">
                {activeApt ? "Next in Line" : "2 Ahead"}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Estimated wait time: <span className="font-bold text-slate-900">~10 minutes</span>
              </p>
            </div>

            {activeApt && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Visit Reason:</span>
                  <span className="font-bold">{activeApt.symptoms}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doctor:</span>
                  <span className="font-bold">Dr. Nkosi</span>
                </div>
              </div>
            )}

            <Button 
              onClick={() => setQueueModalOpen(false)}
              className="w-full bg-[#0A7D6F] hover:bg-[#086b5e] text-white rounded-xl font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}