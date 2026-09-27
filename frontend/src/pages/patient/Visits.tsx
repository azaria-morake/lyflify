import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Stethoscope, 
  Pill, FileCheck, ArrowRight, ShieldCheck, HeartPulse
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SindiLogo, ClinicIcon } from '@/assets/sindiAssets';
import NotificationBell from '@/components/NotificationBell';

export default function Visits() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['carePath'],
    queryFn: async () => {
      const res = await api.get('/navigator/status/demo_user');
      return res.data;
    },
    refetchInterval: 3000
  });

  const cancelMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: 'cancel' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carePath'] })
  });

  const activeVisit = appointments && appointments.length > 0 ? appointments[0] : null;
  const schedule = activeVisit?.schedule;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#FAF7F2] min-h-screen pb-28 md:pb-8">
      {/* Top Header */}
      <header className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0A7D6F]/10 flex items-center justify-center shrink-0">
            <img src={ClinicIcon} alt="Visits" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Clinic Visits</h1>
            <p className="text-slate-500 text-xs font-medium">Scheduled appointments & journey tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeVisit && (
            <Badge className={activeVisit.status === 'Pending Approval' ? "bg-amber-500 text-white px-3 py-1 font-semibold text-xs" : "bg-[#0A7D6F] text-white px-3 py-1 font-semibold text-xs"}>
              {activeVisit.status || 'Confirmed'}
            </Badge>
          )}
          <NotificationBell />
        </div>
      </header>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 animate-pulse">
          <HeartPulse className="w-8 h-8 mx-auto mb-2 text-[#0A7D6F] animate-spin" />
          <p className="text-sm font-semibold">Loading your appointment details...</p>
        </div>
      ) : activeVisit ? (
        <div className="space-y-5">
          {activeVisit.status === 'Pending Approval' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              <div className="text-xs text-amber-900">
                <span className="font-bold">Booking Request Under Review:</span> Sindi transmitted your symptoms and chat transcript to clinic staff. You will receive an alert under Notifications once confirmed.
              </div>
            </div>
          )}
          {/* Confirmed Appointment Card */}
          <Card className="border-slate-200/90 shadow-md rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-[#0A7D6F] to-[#086b5e] text-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-teal-100">
                    Sindi Clinic Appointment
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    {activeVisit.doctor_name || "Dr. Zulu"} • Consultation
                  </h2>
                  <p className="text-xs text-white/80 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{schedule?.appointment_date || "Today"}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated time: {activeVisit.time || schedule?.doctor_time || "10:30"}</span>
                  </p>
                </div>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                  {activeVisit.score || "High Priority"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* SCHEDULE TIMELINE */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0A7D6F]" />
                  Your Visit Timeline
                </h3>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
                  {/* Step 1: Arrival */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0A7D6F] text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                      1
                    </span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-slate-800">Arrival & Reception Check-in</p>
                      <span className="text-xs font-mono font-bold text-[#0A7D6F] bg-teal-50 px-2 py-0.5 rounded-md">
                        {schedule?.arrival_time || "10:15"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Sanitize at entrance and confirm your arrival with reception.</p>
                  </div>

                  {/* Step 2: Vitals */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0A7D6F] text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                      2
                    </span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-slate-800">Nurse Vitals & Triage Check</p>
                      <span className="text-xs font-mono font-bold text-[#0A7D6F] bg-teal-50 px-2 py-0.5 rounded-md">
                        {schedule?.vitals_time || "10:25"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Blood pressure, temperature, and oxygen saturation screening.</p>
                  </div>

                  {/* Step 3: Doctor Consultation */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0A7D6F] text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                      3
                    </span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-slate-800">Doctor Consultation ({activeVisit.doctor_name || "Dr. Zulu"})</p>
                      <span className="text-xs font-mono font-bold text-[#0A7D6F] bg-teal-50 px-2 py-0.5 rounded-md">
                        {schedule?.doctor_time || activeVisit.time || "10:35"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Room 3 for clinical examination and treatment plan.</p>
                  </div>

                  {/* Step 4: Medication Pickup */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                      4
                    </span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-slate-800">Medication & Pharmacy Pickup</p>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {schedule?.medication_pickup_time || "11:00"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Collect digital prescription medicines from counter 2.</p>
                  </div>
                </div>
              </div>

              {/* INTERIM ADVICE */}
              <div className="bg-[#EAF5F3] p-4 rounded-xl border border-[#0A7D6F]/20 space-y-1.5">
                <div className="flex items-center gap-2 text-[#0A7D6F]">
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Interim Care Advice from Sindi</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {schedule?.interim_notes || "Please rest, stay hydrated with warm water, and avoid cold air. If you experience worsening breathlessness or severe chest pain, seek immediate emergency help."}
                </p>
              </div>

              {/* WHAT TO BRING ALONG */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#0A7D6F]" />
                  What to Bring Along
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(schedule?.what_to_bring || [
                    "South African ID or Passport",
                    "Clinic / Health Card",
                    "Current chronic medications"
                  ]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => cancelMutation.mutate(activeVisit.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Visit
                </Button>
                <Button 
                  size="sm"
                  className="bg-[#0A7D6F] hover:bg-[#086b5e] text-white text-xs font-semibold rounded-xl"
                  onClick={() => navigate('/triage')}
                >
                  Ask Sindi a Question <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#0A7D6F]/10 mx-auto flex items-center justify-center">
            <Calendar className="w-8 h-8 text-[#0A7D6F]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Active Visits Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              If you feel unwell or need a medical consultation, talk to Sindi for quick triage and automated booking.
            </p>
          </div>
          <Button 
            className="bg-[#0A7D6F] hover:bg-[#086b5e] text-white rounded-xl text-xs font-bold px-6 py-2.5"
            onClick={() => navigate('/triage')}
          >
            Start Triage with Sindi
          </Button>
        </div>
      )}
    </div>
  );
}
