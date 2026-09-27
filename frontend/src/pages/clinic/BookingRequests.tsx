import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Inbox, Clock, CheckCircle2, AlertCircle, FileText, 
  UserCheck, Stethoscope, ChevronRight, XCircle, Sparkles, Filter
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Patient } from '@/types';

const DOCTORS_ON_DUTY = [
  { id: "dr.zulu@lyflify.com", name: "Dr. Zulu", specialty: "General Medicine" },
  { id: "sr.dlamini@lyflify.com", name: "Sr. Dlamini", specialty: "Triage & Vitals" },
  { id: "dr.naidoo@lyflify.com", name: "Dr. Naidoo", specialty: "Trauma Unit" },
];

export default function BookingRequests() {
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctorMap, setSelectedDoctorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, "queue"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];

      // Filter only booking requests (Pending Approval)
      setRequests(liveData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching live booking requests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pendingRequests = requests.filter(p => p.status === 'Pending Approval');
  const recentScheduled = requests.filter(p => p.status === 'Waiting for Doctor' || p.status === 'In Review');

  const approveMutation = useMutation({
    mutationFn: async ({ docId, doctorId, doctorName }: { docId: string; doctorId: string; doctorName: string }) => {
      const res = await api.post('/booking/update', {
        doc_id: docId,
        action: 'approve',
        payload: { doctor_id: doctorId, doctor_name: doctorName }
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Booking Request Approved & Scheduled", {
        description: `Patient assigned to ${variables.doctorName}. Smart schedule and push notification dispatched.`
      });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    },
    onError: () => {
      toast.error("Failed to approve booking request");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: 'cancel' });
    },
    onSuccess: () => {
      toast.info("Booking Request Declined");
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    }
  });

  const handleApprove = (patient: Patient) => {
    const doctorId = selectedDoctorMap[patient.id] || DOCTORS_ON_DUTY[0].id;
    const doctorObj = DOCTORS_ON_DUTY.find(d => d.id === doctorId) || DOCTORS_ON_DUTY[0];
    approveMutation.mutate({
      docId: patient.id,
      doctorId: doctorObj.id,
      doctorName: doctorObj.name
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Inbox className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Requests</h1>
              {pendingRequests.length > 0 && (
                <span className="bg-amber-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                  {pendingRequests.length} New
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Incoming patient requests from Sindi Triage Chat. Review AI severity, symptoms, and transcripts to confirm queue schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-slate-600 bg-slate-50 border-slate-200">
            {pendingRequests.length} Pending • {recentScheduled.length} Scheduled
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        
        {/* PENDING REQUESTS SECTION */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Awaiting Staff Review ({pendingRequests.length})
          </h2>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 animate-pulse">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-amber-500 animate-bounce" />
              <p className="text-sm font-medium">Checking for incoming booking requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">All Booking Requests Cleared</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When a patient reports symptoms to Nurse Sindi in triage chat and clicks <strong>"Book Appointment"</strong>, their request, clinical acuity, and chat transcript will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((patient) => {
                const isUrgent = patient.urgent || String(patient.score).toLowerCase().includes("critical");
                const currentDoc = selectedDoctorMap[patient.id] || DOCTORS_ON_DUTY[0].id;

                return (
                  <Card key={patient.id} className="rounded-2xl border-slate-200/90 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
                    <CardHeader className="p-5 pb-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                            isUrgent ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {patient.name?.charAt(0) || patient.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900 leading-tight">
                                {patient.name || patient.patient_name || 'Patient'}
                              </h3>
                              <Badge className={isUrgent ? "bg-red-600 text-white font-bold text-[10px]" : "bg-amber-500 text-white font-bold text-[10px]"}>
                                {patient.score || 'High Priority'}
                              </Badge>
                              <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 text-[10px] font-semibold">
                                Pending Approval
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Patient ID: {patient.patient_id || 'demo_user'} • Submitted: {patient.created_at ? new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                      
                      {/* Symptoms reported */}
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Reported Symptoms:
                        </span>
                        <p className="text-sm font-medium text-slate-800 italic">
                          "{patient.symptoms || "Symptoms reported during triage chat."}"
                        </p>
                      </div>

                      {/* Chat Transcript Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            Triage Chat Transcript (Manual Clinical Verification)
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">Auto-captured from Sindi chat</span>
                        </div>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                          {patient.transcript || "Patient engaged with Nurse Sindi triage system and requested clinical consultation."}
                        </div>
                      </div>

                      {/* Action Bar & Doctor Assignment */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                          <span className="text-xs font-semibold text-slate-500 shrink-0">Assign Doctor:</span>
                          <select 
                            value={currentDoc} 
                            onChange={(e) => {
                              setSelectedDoctorMap(prev => ({ ...prev, [patient.id]: e.target.value }));
                            }}
                            className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                          >
                            {DOCTORS_ON_DUTY.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => cancelMutation.mutate(patient.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-[#0A7D6F] hover:bg-[#086b5e] text-white font-bold text-xs rounded-xl shadow-sm px-4 h-9"
                            onClick={() => handleApprove(patient)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            {approveMutation.isPending ? "Scheduling..." : "Accept & Order Queue Schedule"}
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENTLY SCHEDULED SECTION */}
        {recentScheduled.length > 0 && (
          <div className="pt-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Recently Confirmed & Scheduled ({recentScheduled.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentScheduled.slice(0, 4).map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{p.name || p.patient_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attending: {p.doctor_name || 'Dr. Zulu'} • Time: {p.time || '10:30'}
                    </p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
