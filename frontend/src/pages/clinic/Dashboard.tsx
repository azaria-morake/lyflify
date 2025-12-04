import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Search, Bell, MoreHorizontal, CheckCircle2, AlertCircle, Stethoscope, BrainCircuit, Clock } from 'lucide-react';

// Relative imports
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';

const getScore = (patient: any): number => {
  if (!patient) return 0;
  if (typeof patient.score === 'number') return patient.score;
  if (typeof patient.score === 'string') {
    const match = patient.score.match(/\((\d+)\/10\)/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
};

const sortPatients = (a: any, b: any) => {
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return (a.time || '').localeCompare(b.time || '');
};

const fetchQueue = async () => {
  const response = await api.get('/queue');
  return response.data;
};

export default function ClinicDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['liveQueue'],
    queryFn: fetchQueue,
    refetchInterval: 5000, 
  });

  const sortedPatients = useMemo(() => {
    return patients ? [...patients].sort(sortPatients) : [];
  }, [patients]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      // 2.3 FIX: Ensure we send the correct ID and action
      await api.post('/booking/update', { patient_id: id, action: "approve" });
    },
    onSuccess: () => {
      setShowModal(false);
      // Force refresh to show updated status
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
    }
  });

  const handleReview = (patient: any) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  if (isLoading) return <div className="p-6 text-xl text-teal-600 animate-pulse">Connecting to Live Queue...</div>;
  if (error) return <div className="p-6 text-xl text-red-600">Error loading queue: {error.message}</div>;
  
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <BrainCircuit className="w-5 h-5 mr-2 text-teal-600" />
          AI Triage Queue
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <Input className="pl-9 w-64 bg-slate-50" placeholder="Search patient ID..." />
          </div>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
          </Button>
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
              {sortedPatients.map((patient: any, i: number) => {
                const score = getScore(patient);
                const isCritical = score >= 9;
                
                return (
                  <TableRow 
                    key={i} 
                    className={`cursor-pointer transition-colors ${
                      isCritical ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleReview(patient)}
                  >
                    {/* 2.1 FIX: Use fallback if fields are missing */}
                    <TableCell className="font-medium text-slate-500">{patient.time || "--:--"}</TableCell>
                    <TableCell className="font-semibold text-slate-700">{patient.name || "Unknown Patient"}</TableCell>
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
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle className="text-xl">Review Triage: {selectedPatient?.name}</DialogTitle>
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
                  <p className="text-slate-700 mt-1 italic">
                    "{selectedPatient?.symptoms || "Symptoms reported via Triage Chat"}"
                  </p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Reasoning</span>
                  <p className="text-slate-700 mt-1">
                    {getScore(selectedPatient) >= 9 
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

          <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="outline" onClick={() => setShowModal(false)}>Request Vitals</Button>
            
            {/* 2.2 FIX: Use 'mutate' (not async call) and bind specific ID */}
            <Button 
              className="bg-teal-600 hover:bg-teal-700" 
              onClick={() => approveMutation.mutate(selectedPatient?.patient_id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Confirming..." : 
               selectedPatient?.urgent ? "Approve Emergency Admit" : "Approve & Admit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}