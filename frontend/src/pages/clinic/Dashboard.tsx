import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { Search, Bell, MoreHorizontal, CheckCircle2, AlertCircle, Stethoscope, BrainCircuit, Clock, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"; // Import Firestore functions

import api from '../../lib/api';
import { db } from '../../lib/firebase'; // Import your initialized DB
import { Patient } from '../../types'; 
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ... (Keep your getScore, getWaitTime, sortPatients helpers exactly as they were) ...
const getScore = (patient: Patient): number => {
  if (!patient) return 0;
  if (typeof patient.score === 'number') return patient.score;
  if (typeof patient.score === 'string') {
    const match = patient.score.match(/\((\d+)\/10\)/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
};

const getWaitTime = (createdAt: string) => {
  if (!createdAt) return "Just now";
  try {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (isNaN(mins)) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  } catch (e) {
    return "Just now";
  }
};

const sortPatients = (a: Patient, b: Patient) => {
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return (a.time || '').localeCompare(b.time || '');
};

export default function ClinicDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  
  // NEW: Local state for Real-Time Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const queryClient = useQueryClient();
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultPatient, setConsultPatient] = useState<Patient | null>(null);

  // --- REPLACED: useQuery Polling -> useEffect Listener ---
  useEffect(() => {
    // Create a listener on the 'queue' collection
    const q = query(collection(db, "queue"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(liveData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching real-time data:", error);
      setIsLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);
  // --------------------------------------------------------

  const sortedPatients = useMemo(() => {
    if (!patients) return [];
    
    const filtered = patients.filter((p) => {
      const query = searchQuery.toLowerCase();
      const name = (p.name || p.patient_name || "").toLowerCase();
      const id = (p.patient_id || "").toLowerCase();
      return name.includes(query) || id.includes(query);
    });

    return filtered.sort(sortPatients);
  }, [patients, searchQuery]);

  // --- ACTIONS (Keep utilizing API for logic/writes) ---
  const approveMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "approve" });
    },
    onSuccess: () => {
      setActionStatus('success');
      // No need to invalidateQuery, the Listener handles the UI update!
    },
    onError: () => setActionStatus('error')
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "delete" });
    },
    onSuccess: () => setShowModal(false)
  });

  const vitalsMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "vitals" });
    },
    onSuccess: () => console.log("Vitals requested")
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/records/create', {
        patient_id: data.patient_id,
        patient_name: data.patient_name, // <--- Pass the name
        doctor_name: "Dr. Nkosi", 
        diagnosis: data.diagnosis,
        meds: data.meds.split(',').map((m: string) => m.trim()),
        notes: data.notes
      });
      
      await api.post('/booking/update', { doc_id: data.doc_id, action: "delete" });
    },
    onSuccess: () => setShowConsultModal(false)
  });

  // ... (Rest of your component logic: handleClose, delayMutation, handleReview, Render Return) ...
  // Be sure to copy the rest of your JSX from the previous file or keep it as is. 
  // The only big change was replacing `useQuery` with `useEffect`.

  // FOR BREVITY: I'm only including the changed logic above. 
  // Make sure you replace the `useQuery` block and imports, but keep your JSX render the same!
  
  // ...
  // [JSX RENDER CODE REMAINS THE SAME]
  // ...
  
  // COPY-PASTE NOTE: When you implement this, ensure the `NOTIFICATIONS` constant 
  // and the entire `return (` block remains exactly as it was in your previous file.
  
  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => setActionStatus('idle'), 300); 
  };

  const delayMutation = useMutation({
    mutationFn: async () => {
      await api.post('/navigator/delay');
    },
    // No onSuccess needed strictly, but good for logs
  });

  const handleReview = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const NOTIFICATIONS = [
    { id: 1, title: "System Delay Activated", desc: "15min buffer added.", time: "Just now", type: "alert" },
    { id: 2, title: "High Urgency Triage", desc: "New patient flagged Critical.", time: "2m ago", type: "critical" },
    { id: 3, title: "Vitals Received", desc: "Thabo Mbeki - BP: 140/90", time: "15m ago", type: "info" },
    { id: 4, title: "Shift Handoff", desc: "Dr. Zulu checked in.", time: "1h ago", type: "info" }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <BrainCircuit className="w-5 h-5 mr-2 text-teal-600" />
          AI Triage Queue
        </h2>
        <div className="flex items-center space-x-4">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => delayMutation.mutate()}
            disabled={delayMutation.isPending}
            className="shadow-md"
          >
            {delayMutation.isPending ? "Simulating..." : "⚠ Simulate Delay (+15m)"}
          </Button>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <Input 
              className="pl-9 w-64 bg-slate-50" 
              placeholder="Search patient ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader className="mb-6">
                <SheetTitle>Clinic Activity Feed</SheetTitle>
                <SheetDescription>Real-time updates from Triage AI and Patient Queue.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6">
                {NOTIFICATIONS.map((notif) => (
                  <div key={notif.id} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      notif.type === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                      notif.type === 'alert' ? 'bg-amber-500' : 'bg-teal-500'
                    }`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500">{notif.desc}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase pt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="p-6 overflow-auto flex-1">
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>AI Urgency Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    <TableCell><div className="h-4 w-12 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-slate-100 rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-slate-100 rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    No active patients in queue.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPatients.map((patient, i) => {
                  const score = getScore(patient);
                  const isCritical = score >= 9;
                  
                  return (
                    <TableRow 
                      key={patient.id || i} 
                      className={`cursor-pointer transition-colors ${
                        isCritical ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => handleReview(patient)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{patient.time || "--:--"}</span>
                          <span className="text-xs text-slate-400">{getWaitTime(patient.created_at)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="font-semibold text-slate-700">
                        {patient.name || patient.patient_name || "Unknown Patient"}
                      </TableCell>
                      
                      <TableCell className="text-slate-500 font-mono text-xs">{patient.patient_id}</TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${
                            score >= 9 ? 'bg-red-100 text-red-700 border-red-200' :
                            score >= 6 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-green-100 text-green-700 border-green-200'
                          }`}
                        >
                          {patient.score || "N/A"}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`h-2 w-2 rounded-full ${patient.urgent ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                          <span className="text-xs font-medium uppercase text-slate-500">{patient.status}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            setConsultPatient(patient);
                            setShowConsultModal(true);
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {actionStatus === 'success' && (
            <div className="flex flex-col items-center justify-center h-[300px] space-y-4 bg-green-50">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800">Success!</h2>
              <p className="text-slate-600 text-center max-w-sm">
                Patient has been approved. Notification sent.
              </p>
              <div className="flex gap-3 mt-4">
                <Button disabled className="bg-green-600 text-white opacity-100">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmed
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => selectedPatient && vitalsMutation.mutate(selectedPatient.id)}
                  disabled={vitalsMutation.isPending}
                  className="border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  {vitalsMutation.isPending ? "Requesting..." : "Request Vitals"}
                </Button>
                <Button variant="ghost" onClick={handleClose}>Close</Button>
              </div>
            </div>
          )}

          {actionStatus === 'error' && (
             <div className="flex flex-col items-center justify-center h-[300px] space-y-4 bg-red-50">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-800">Connection Failed</h2>
              <p className="text-red-600 text-center max-w-sm font-medium">
                We couldn't reach the server. Please check your connection.
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleClose} className="border-red-200 text-red-700 hover:bg-red-100">Cancel</Button>
                <Button 
                  onClick={() => selectedPatient && approveMutation.mutate(selectedPatient.id)} 
                  disabled={approveMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {approveMutation.isPending ? "Retrying..." : "Try Again"}
                </Button>
              </div>
            </div>
          )}

          {actionStatus === 'idle' && (
            <>
              <DialogHeader className="p-6 border-b">
                <div className="flex justify-between items-center pr-8">
                  <div>
                    <DialogTitle className="text-xl">Review Triage: {selectedPatient?.patient_name || selectedPatient?.name}</DialogTitle>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                      ID: {selectedPatient?.patient_id} 
                      <span className="mx-2">•</span> 
                      <Clock className="w-3 h-3 mr-1" /> Checked in at {selectedPatient?.time}
                    </p>
                  </div>
                  {selectedPatient && (
                    <Badge className="text-lg px-4 py-1" variant={selectedPatient.urgent ? 'destructive' : 'secondary'}>
                      Score: {selectedPatient.score}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              {selectedPatient?.status === 'Cancelled' && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-0">
                  <p className="font-bold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Attention: Patient Cancelled
                  </p>
                  <p className="text-sm">This booking was cancelled by the patient. Do not approve unless they are physically present.</p>
                </div>
              )}

              <div className="flex flex-1 overflow-hidden h-[500px]">
                <div className="w-1/2 p-6 border-r flex flex-col space-y-4">
                  <h4 className="font-semibold flex items-center text-slate-700"><Stethoscope className="w-4 h-4 mr-2" /> Doctor's Assessment</h4>
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-slate-500">Clinical Observations</label>
                    <Textarea 
                      className="h-full resize-none p-4 text-sm focus:ring-teal-600 bg-slate-50" 
                      placeholder="Enter clinical observations..." 
                      defaultValue={`Patient flagged as ${selectedPatient?.urgent ? 'URGENT' : 'Routine'} by AI.\n\nVerify vitals immediately.`} 
                    />
                  </div>
                </div>

                <div className="w-1/2 p-6 bg-sky-50/50 flex flex-col space-y-4">
                  <h4 className="font-semibold flex items-center text-teal-800"><BrainCircuit className="w-4 h-4 mr-2" /> AI Summary (Llama 3)</h4>
                  <div className="bg-white p-4 rounded-lg border border-sky-100 shadow-sm space-y-3 text-sm">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reported Symptoms</span>
                      <p className="text-slate-700 mt-1 italic">"{selectedPatient?.symptoms || "Symptoms reported via Triage Chat"}"</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Reasoning</span>
                      <p className="text-slate-700 mt-1">
                        {getScore(selectedPatient!) >= 9 
                          ? "High urgency detected. Keywords match critical protocol (Cardiac/Respiratory)." 
                          : "Standard triage protocol. No immediate life-threatening keywords detected."}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Action</span>
                      <div className="flex items-center space-x-2 mt-1 text-teal-700 font-medium">
                        {selectedPatient?.urgent ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{selectedPatient?.urgent ? "Admit Immediately" : "Queue for Vitals"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto bg-amber-50 p-3 rounded border border-amber-100 text-xs text-amber-800 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    AI suggestions are for support only. Final clinical decision rests with the provider.
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 border-t bg-slate-50 flex justify-between sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>Close</Button>
                  {selectedPatient?.status === 'Cancelled' && (
                    <Button 
                      variant="destructive"
                      onClick={() => selectedPatient && deleteMutation.mutate(selectedPatient.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteMutation.isPending ? "Removing..." : "Remove Record"}
                    </Button>
                  )}
                </div>
                <div>
                  {selectedPatient?.status === 'Confirmed' ? (
                    <Button disabled className="bg-green-600 text-white opacity-100">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmed
                    </Button>
                  ) : selectedPatient?.status === 'Cancelled' ? (
                    <Button disabled variant="secondary" className="bg-slate-200 text-slate-500 cursor-not-allowed">
                      🚫 Booking Cancelled
                    </Button>
                  ) : (
                    <Button 
                      className="bg-teal-600 hover:bg-teal-700" 
                      onClick={() => selectedPatient && approveMutation.mutate(selectedPatient.id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "Confirming..." : 
                       selectedPatient?.urgent ? "Approve Emergency Admit" : "Approve & Admit"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConsultModal} onOpenChange={setShowConsultModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Consultation: {consultPatient?.name || consultPatient?.patient_name}</DialogTitle>
            <p className="text-sm text-slate-500">
              Complete this form to discharge the patient and update their records.
            </p>
          </DialogHeader>
          <form 
  className="space-y-4 py-4"
  onSubmit={(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (consultPatient) {
      createRecordMutation.mutate({
        patient_id: consultPatient?.patient_id,
        patient_name: consultPatient?.name || consultPatient?.patient_name || "Unknown", // <--- ADD THIS
        doc_id: consultPatient?.id,
        diagnosis: formData.get('diagnosis'),
        meds: formData.get('meds'),
        notes: formData.get('notes'),
      });
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Diagnosis</label>
              <Input name="diagnosis" placeholder="e.g. Upper Respiratory Infection" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Medication (Comma separated)</label>
              <Input name="meds" placeholder="e.g. Amoxicillin 500mg, Panado" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clinical Notes</label>
              <Textarea name="notes" placeholder="Patient observations..." required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConsultModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createRecordMutation.isPending}>
                {createRecordMutation.isPending ? "Discharging..." : "Save & Discharge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}