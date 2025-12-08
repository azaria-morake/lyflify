import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { 
  Search, Bell, MoreHorizontal, CheckCircle2, AlertCircle, Stethoscope, 
  BrainCircuit, Clock, Trash2, UserRound, Activity, Copy, ChevronRight
} from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";

import api from '../../lib/api';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../lib/store';
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
import { toast } from 'sonner';

// --- MOCK DOCTORS LIST ---
const DOCTORS_ON_DUTY = [
  { id: "dr.zulu@lyflify.com", name: "Dr. Zulu", specialty: "General Practitioner" },
  { id: "dr.nkosi@lyflify.com", name: "Dr. Nkosi", specialty: "Pediatrics" },
  { id: "dr.naidoo@lyflify.com", name: "Dr. Naidoo", specialty: "Trauma Unit" },
];

const NOTIFICATIONS = [
  { id: 1, title: "System Delay Activated", desc: "15min buffer added.", time: "Just now", type: "alert" },
  { id: 2, title: "High Urgency Triage", desc: "New patient flagged Critical.", time: "2m ago", type: "critical" },
  { id: 3, title: "Vitals Received", desc: "Thabo Mbeki - BP: 140/90", time: "15m ago", type: "info" },
  { id: 4, title: "Shift Handoff", desc: "Dr. Zulu checked in.", time: "1h ago", type: "info" }
];

// --- HELPERS ---
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

const getStatusColor = (status: string, urgent: boolean) => {
  if (urgent || status === 'Emergency En Route') return 'text-red-700 bg-red-50 border-red-200';
  if (status === 'Waiting for Doctor') return 'text-indigo-700 bg-indigo-50 border-indigo-200';
  if (status === 'Pending Approval') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (status === 'Confirmed') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'In Review') return 'text-blue-700 bg-blue-50 border-blue-200';
  return 'text-slate-600 bg-slate-100 border-slate-200';
};

const sortPatients = (a: Patient, b: Patient) => {
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return (a.time || '').localeCompare(b.time || '');
};

export default function ClinicDashboard() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Action Modals
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultPatient, setConsultPatient] = useState<Patient | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS_ON_DUTY[0]);
  const [medsInput, setMedsInput] = useState("");

  // --- REAL-TIME DATA ---
  useEffect(() => {
    const q = query(collection(db, "queue"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(liveData);
      setIsLoading(false);
    }, (error) => {
      console.error("Data fetch error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FILTERING ---
  const sortedPatients = useMemo(() => {
    if (!patients) return [];
    
    const filtered = patients.filter((p) => {
      const query = searchQuery.toLowerCase();
      const name = (p.name || p.patient_name || "").toLowerCase();
      const id = (p.patient_id || "").toLowerCase();
      if (!(name.includes(query) || id.includes(query))) return false;

      // 1. Clinic Admin View
      if (user?.role === 'CLINIC') {
        return true; 
      } 
      
      // 2. Doctor View
      if (user?.role === 'DOCTOR') {
        return (p.doctor_id === user.id) || 
               (p.status === 'Waiting for Doctor') || 
               (p.status === 'In Review') ||
               (p.urgent === true); // Always show emergencies
      }
      return true;
    });

    return filtered.sort(sortPatients);
  }, [patients, searchQuery, user]);

  // --- ACTIONS ---
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) return;
      await api.post('/booking/update', { 
        doc_id: selectedPatient.id, 
        action: "assign",
        payload: { doctor_id: selectedDoctor.id, doctor_name: selectedDoctor.name }
      });
    },
    onSuccess: () => {
      const pName = selectedPatient?.name || selectedPatient?.patient_name || "Patient"; 
      setShowAssignModal(false);
      setShowModal(false); 
      toast.success("Doctor Assigned", {
        description: `${pName} assigned to ${selectedDoctor.name}.`
      });
    },
    onError: () => toast.error("Assignment Failed", { description: "Check backend logs." })
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/records/create', {
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        doctor_name: user?.name || "Dr. Zulu", 
        diagnosis: data.diagnosis,
        meds: data.meds.split(',').map((m: string) => m.trim()),
        notes: data.notes
      });
      await api.post('/booking/update', { doc_id: data.doc_id, action: "delete" });
    },
    onSuccess: () => {
      setShowConsultModal(false);
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['allPatients'] }); 
      toast.success("Patient Discharged", {
        description: "Medical records updated successfully."
      });
    }
  });

  const delayMutation = useMutation({
    mutationFn: async () => { await api.post('/navigator/delay'); },
    onSuccess: () => toast.warning("Simulated Delay", { description: "+15 minutes added to all patients." })
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.post('/booking/update', { doc_id: docId, action: "delete" });
    },
    onSuccess: () => {
      setShowModal(false);
      toast.info("Record Removed");
    }
  });

  // --- HELPERS ---
  const isDoctor = user?.role === 'DOCTOR';
  
  const handleClose = () => {
    setShowModal(false);
  };

  const addQuickScript = (med: string) => {
    setMedsInput(prev => prev ? `${prev}, ${med}` : med);
  };

  return (
    <div className={`flex flex-col h-full ${isDoctor ? 'bg-indigo-50/30' : 'bg-slate-50'}`}>
      
      {/* HEADER */}
      <header className={`flex flex-col md:flex-row md:h-16 md:items-center justify-between px-6 py-4 md:py-0 border-b sticky top-0 z-10 gap-4 ${isDoctor ? 'bg-indigo-600 text-white shadow-md' : 'bg-white'}`}>
        <div className="flex items-center justify-between w-full md:w-auto">
          <h2 className="text-lg font-semibold flex items-center">
            {isDoctor ? (
              <><Stethoscope className="w-5 h-5 mr-2 text-indigo-200" /> Dr. Zulu's Queue</>
            ) : (
              <><Activity className="w-5 h-5 mr-2 text-teal-600" /> Clinic Operations</>
            )}
          </h2>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                {/* --- FIXED NOTIFICATION BELL --- */}
                <Button variant="ghost" size="icon" className={`relative ${isDoctor ? "text-white hover:bg-indigo-700" : ""}`}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-6">
                  <SheetTitle>Clinic Activity Feed</SheetTitle>
                  <SheetDescription>Real-time updates.</SheetDescription>
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
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          {isDoctor && (
            <div className="hidden md:flex items-center bg-indigo-700/50 px-3 py-1 rounded-full border border-indigo-500/50">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-indigo-100">On Duty</span>
            </div>
          )}

          {!isDoctor && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => delayMutation.mutate()}
              disabled={delayMutation.isPending}
              className="shadow-md w-full md:w-auto"
            >
              {delayMutation.isPending ? "Simulating..." : "⚠ Simulate Delay (+15m)"}
            </Button>
          )}

          <div className="relative w-full md:w-64">
            <Search className={`h-4 w-4 absolute left-3 top-3 ${isDoctor ? "text-indigo-200" : "text-slate-400"}`} />
            <Input 
              className={`pl-9 w-full ${isDoctor ? "bg-indigo-700/50 border-indigo-500/50 text-white placeholder:text-indigo-300 focus-visible:ring-indigo-400" : "bg-slate-50"}`} 
              placeholder="Search patient..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:block">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant={isDoctor ? "secondary" : "outline"} size="icon" className="relative">
                  <Bell className={`h-4 w-4 ${isDoctor ? "text-indigo-700" : ""}`} />
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-6">
                  <SheetTitle>Clinic Activity Feed</SheetTitle>
                  <SheetDescription>Real-time updates from Triage AI.</SheetDescription>
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
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="p-4 md:p-6 overflow-auto flex-1">
        
        {/* --- MOBILE VIEW (Redesigned Cards) --- */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
             <div className="text-center text-slate-400 py-10">Loading Queue...</div>
          ) : sortedPatients.length === 0 ? (
             <div className="text-center text-slate-400 py-10">No patients found.</div>
          ) : (
            sortedPatients.map((patient) => {
              const score = getScore(patient);
              const isCritical = score >= 9;
              const isAssigned = patient.status === 'Waiting for Doctor';
              return (
                <div 
                  key={patient.id}
                  onClick={() => { setSelectedPatient(patient); setShowModal(true); }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden active:scale-[0.99] transition-all duration-200"
                >
                  {/* Urgent Strip */}
                  {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 z-10" />}
                  
                  <div className={`p-4 flex flex-col gap-3 ${isCritical ? "pl-5" : ""}`}>
                    
                    {/* Header: Name & Score */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                          {patient.name || patient.patient_name || "Unknown"}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: {patient.patient_id?.slice(0,10)}...
                        </p>
                      </div>
                      <Badge variant="outline" className={`${
                        score >= 9 ? 'bg-red-50 text-red-700 border-red-200' :
                        score >= 6 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      } font-bold px-2 py-0.5 text-xs`}>
                        Score: {patient.score}
                      </Badge>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 mr-1.5">{patient.time || "--:--"}</span>
                        <span className="text-slate-300 border-l pl-1.5 border-slate-200">
                          {getWaitTime(patient.created_at)}
                        </span>
                      </div>
                      
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${getStatusColor(patient.status, patient.urgent)}`}>
                        {patient.status}
                      </span>
                    </div>

                    {/* Action Area */}
                    <div className="pt-2">
                        {isDoctor ? (
                          <Button 
                            size="sm" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-lg h-10 font-medium" 
                            disabled={patient.status === 'Cancelled'}
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setConsultPatient(patient); 
                              setMedsInput("");
                              setShowConsultModal(true);
                            }}
                          >
                            <Stethoscope className="w-4 h-4 mr-2" /> Consult Patient
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant={isAssigned ? "secondary" : "outline"}
                            disabled={isAssigned || patient.status === 'Cancelled'}
                            className={`w-full h-10 font-medium ${isAssigned ? 'bg-slate-100 text-slate-500' : 'border-teal-200 text-teal-700 bg-teal-50/50'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                              setShowAssignModal(true);
                            }}
                          >
                            {isAssigned ? "Assigned to Dr." : patient.status === 'Cancelled' ? "Booking Cancelled" : "Assign Doctor"}
                            {!isAssigned && patient.status !== 'Cancelled' && <ChevronRight className="w-4 h-4 ml-2 opacity-50" />}
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- DESKTOP VIEW (Table) --- */}
        <div className="hidden md:block rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>AI Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    <TableCell><div className="h-4 w-12 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-slate-100 rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-slate-100 rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-20 bg-slate-100 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      {isDoctor ? (
                        <>
                          <div className="bg-indigo-50 p-6 rounded-full mb-4">
                            <CheckCircle2 className="h-12 w-12 text-indigo-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-700">All Caught Up!</h3>
                          <p className="text-sm text-slate-500">You have no active consultations.</p>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-100 p-6 rounded-full mb-4">
                            <UserRound className="h-12 w-12 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-700">Waiting Room Empty</h3>
                          <p className="text-sm text-slate-500">Waiting for new check-ins...</p>
                        </>
                      )}
                    </div>
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
                      onClick={() => { setSelectedPatient(patient); setShowModal(true); }}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(patient.status, patient.urgent)}`}>
                          {patient.urgent && <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>}
                          {patient.status}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isDoctor ? (
                             <Button 
                               size="sm"
                               className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8"
                               disabled={patient.status === 'Cancelled'}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setConsultPatient(patient);
                                 setMedsInput(""); 
                                 setShowConsultModal(true);
                               }}
                             >
                               Consult
                             </Button>
                          ) : (
                             <Button 
                               size="sm"
                               variant="outline"
                               className="border-teal-200 text-teal-700 hover:bg-teal-50 h-8"
                               disabled={patient.status === 'Waiting for Doctor' || patient.status === 'Cancelled'}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedPatient(patient);
                                 setShowAssignModal(true);
                               }}
                             >
                               {patient.status === 'Waiting for Doctor' ? "Assigned" : patient.status === 'Cancelled' ? "Cancelled" : "Assign"}
                             </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setSelectedPatient(patient);
                              setShowModal(true);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- MODAL 1: ASSIGN DOCTOR (Admin) --- */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Doctor to {selectedPatient?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <p className="text-sm text-slate-500 mb-2">Select an available doctor:</p>
            {DOCTORS_ON_DUTY.map((doc) => (
              <div 
                key={doc.id} 
                className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${
                  selectedDoctor.id === doc.id 
                    ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                    : 'hover:border-slate-300 bg-white'
                }`}
                onClick={() => setSelectedDoctor(doc)}
              >
                <div className="flex items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 font-bold ${
                    selectedDoctor.id === doc.id ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {doc.name.charAt(4)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.specialty}</p>
                  </div>
                </div>
                {selectedDoctor.id === doc.id && <CheckCircle2 className="text-teal-600 w-6 h-6" />}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700" 
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: CONSULTATION (Doctor) --- */}
      <Dialog open={showConsultModal} onOpenChange={setShowConsultModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex justify-between items-center pr-2">
              <div>
                <DialogTitle className="text-xl">Consultation: {consultPatient?.name || consultPatient?.patient_name}</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">ID: {consultPatient?.patient_id}</p>
              </div>
              <Badge variant={consultPatient?.urgent ? "destructive" : "secondary"}>Score: {consultPatient?.score}</Badge>
            </div>
          </DialogHeader>

          {/* AI Context */}
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex items-start gap-3 mt-2">
            <BrainCircuit className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-bold block mb-1">AI Triage Note:</span>
              "{consultPatient?.symptoms || "Patient reported general malaise."}"
            </div>
          </div>

          {/* ✨ NEW: VITALS STRIP ✨ */}
<div className="grid grid-cols-4 gap-2 mt-3 mb-1">
  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col items-center">
    <span className="text-[10px] text-slate-400 uppercase font-bold">Heart Rate</span>
    <div className="flex items-center text-slate-700 font-mono font-medium">
      <Activity className="w-3 h-3 mr-1 text-red-500 animate-pulse" /> 78 bpm
    </div>
  </div>
  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col items-center">
    <span className="text-[10px] text-slate-400 uppercase font-bold">Blood Pressure</span>
    <span className="text-slate-700 font-mono font-medium">120/80</span>
  </div>
  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col items-center">
    <span className="text-[10px] text-slate-400 uppercase font-bold">Temp</span>
    <span className="text-slate-700 font-mono font-medium">36.5°C</span>
  </div>
  <div className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col items-center">
    <span className="text-[10px] text-slate-400 uppercase font-bold">O2 Sat</span>
    <span className="text-slate-700 font-mono font-medium">98%</span>
  </div>
</div>

          <form 
            className="space-y-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (consultPatient) {
                createRecordMutation.mutate({
                  patient_id: consultPatient?.patient_id,
                  patient_name: consultPatient?.name || consultPatient?.patient_name || "Unknown",
                  doc_id: consultPatient?.id,
                  diagnosis: formData.get('diagnosis'),
                  meds: medsInput,
                  notes: formData.get('notes'),
                });
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Diagnosis</label>
              <Input name="diagnosis" placeholder="e.g. Acute Bronchitis" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Prescription <span className="text-xs text-slate-400 font-normal">Comma separated</span>
              </label>
              <Input name="meds" value={medsInput} onChange={(e) => setMedsInput(e.target.value)} placeholder="e.g. Amoxicillin 500mg" required />
              <div className="flex gap-2 pt-1 flex-wrap">
                {["Panado (PRN)", "Amoxicillin 500mg", "Vit B Co"].map((script) => (
                  <button key={script} type="button" onClick={() => addQuickScript(script)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border">
                    + {script}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Clinical Notes</label>
              <Textarea name="notes" placeholder="Observations..." required className="h-24" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConsultModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createRecordMutation.isPending}>
                {createRecordMutation.isPending ? "Discharging..." : "Complete & Discharge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: VIEW DETAILS (Rich Split Layout, Responsive) --- */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* HEADER */}
          <DialogHeader className="p-6 border-b bg-white shrink-0">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pr-8">
            

{/* ✨ NEW: JOURNEY TRACKER ✨ */}
<div className="mt-4 flex items-center w-full max-w-md">
  {/* Step 1: Triage */}
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
      true ? 'bg-teal-600 text-white' : 'bg-slate-200'
    }`}>1</div>
    <span className="text-[10px] mt-1 font-medium text-teal-700">Triage</span>
  </div>
  
  <div className={`flex-1 h-1 mx-2 ${selectedPatient?.status !== 'Pending Approval' ? 'bg-teal-600' : 'bg-slate-200'}`} />

  {/* Step 2: Assigned */}
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
      selectedPatient?.doctor_id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
    }`}>2</div>
    <span className={`text-[10px] mt-1 font-medium ${selectedPatient?.doctor_id ? 'text-indigo-700' : 'text-slate-400'}`}>Assigned</span>
  </div>

  <div className={`flex-1 h-1 mx-2 bg-slate-200`} />

  {/* Step 3: Discharge */}
  <div className="flex flex-col items-center">
    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">3</div>
    <span className="text-[10px] mt-1 font-medium text-slate-400">Discharge</span>
  </div>
</div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Review Triage: {selectedPatient?.name || selectedPatient?.patient_name}
                </DialogTitle>
                <div className="flex items-center text-sm text-slate-500 mt-1 gap-2 flex-wrap">
                  <span 
                    className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs border cursor-pointer hover:bg-slate-200 transition-colors flex items-center" 
                    title="Click to copy ID" 
                    onClick={() => { navigator.clipboard.writeText(selectedPatient?.patient_id || ""); toast.success("ID Copied to clipboard"); }}
                  >
                    <Copy className="w-3 h-3 inline mr-1 opacity-50"/>
                    ID: {selectedPatient?.patient_id}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Checked in at {selectedPatient?.time}
                  </span>
                </div>
              </div>
              {selectedPatient && (
                <Badge className="text-lg px-4 py-1 shadow-sm w-fit" variant={selectedPatient.urgent ? 'destructive' : 'secondary'}>
                  Score: {selectedPatient.score}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* TWO COLUMN BODY (Responsive Stacking) */}
          {/* Mobile: Stack vertically, scroll whole body. Desktop: Row, scroll columns if needed */}
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
            
            {/* LEFT: DOCTOR'S ASSESSMENT */}
            <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r flex flex-col space-y-4 bg-white shrink-0">
              <h4 className="font-semibold flex items-center text-slate-700">
                <Stethoscope className="w-4 h-4 mr-2" /> Doctor's Assessment
              </h4>
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-xs font-medium text-slate-500">Clinical Observations</label>
                <Textarea 
                  className={`flex-1 min-h-[150px] md:h-auto resize-none p-4 text-sm bg-slate-50 focus:ring-teal-600 ${!isDoctor ? 'opacity-80 bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                  placeholder={isDoctor ? "Enter your clinical observations here..." : "Doctor's notes will appear here."}
                  disabled={!isDoctor} 
                  defaultValue={`Patient flagged as ${selectedPatient?.urgent ? 'URGENT' : 'Routine'} by AI.\n\nVerify vitals immediately.`} 
                />
              </div>
            </div>

            {/* RIGHT: AI SUMMARY */}
            <div className="w-full md:w-1/2 p-6 bg-sky-50/50 flex flex-col space-y-4">
              <h4 className="font-semibold flex items-center text-teal-800">
                <BrainCircuit className="w-4 h-4 mr-2" /> AI Summary (Llama 3)
              </h4>
              
              <div className="bg-white p-5 rounded-lg border border-sky-100 shadow-sm space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reported Symptoms</span>
                  <p className="text-slate-800 mt-1 font-medium italic">"{selectedPatient?.symptoms || "Symptoms reported via Triage Chat"}"</p>
                </div>
                
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Reasoning</span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {getScore(selectedPatient!) >= 9 
                      ? "High urgency detected. Keywords match critical protocol (Cardiac/Respiratory). Recommended immediate escalation." 
                      : "Standard triage protocol. No immediate life-threatening keywords detected. Patient appears stable."}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Action</span>
                  <div className="flex items-center space-x-2 mt-2 text-teal-700 font-bold bg-teal-50 p-2 rounded border border-teal-100">
                    {selectedPatient?.urgent ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span className={selectedPatient?.urgent ? "text-red-700" : ""}>
                      {selectedPatient?.urgent ? "Admit Immediately" : "Queue for Vitals & Consult"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto bg-amber-50 p-3 rounded border border-amber-100 text-xs text-amber-800 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                AI suggestions are for support only. Final clinical decision rests with the provider.
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="p-4 border-t bg-slate-50 flex flex-wrap gap-2 justify-between sm:justify-between shrink-0">
             <div className="flex gap-2">
               {/* Only Admins can Remove from here */}
               {!isDoctor && (
                 <Button 
                   variant="destructive" 
                   onClick={() => selectedPatient && deleteMutation.mutate(selectedPatient.id)}
                 >
                   <Trash2 className="w-4 h-4 mr-2" /> Remove
                 </Button>
               )}
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto">
               <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleClose}>Close</Button>
               
               {/* Clinic Admin Action: Assign */}
               {!isDoctor && selectedPatient?.status !== 'Completed' && (
                 <Button 
                   className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none" 
                   disabled={selectedPatient?.status === 'Cancelled' || selectedPatient?.status === 'Waiting for Doctor'}
                   onClick={() => { setShowModal(false); setShowAssignModal(true); }}
                 >
                   Assign Doctor
                 </Button>
               )}

               {/* Doctor Action: Go to Consult */}
               {isDoctor && (
                 <Button 
                   className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none" 
                   disabled={selectedPatient?.status === 'Cancelled'}
                   onClick={() => { setShowModal(false); setConsultPatient(selectedPatient); setShowConsultModal(true); }}
                 >
                   Start Consultation
                 </Button>
               )}
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}