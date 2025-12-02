import { useState } from 'react';
import { Search, Bell, MoreHorizontal, CheckCircle2, AlertCircle, Stethoscope, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ClinicDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Mock Data
  const patients = [
    { time: '08:15', name: 'Thabo Mbeki', id: '920211...', score: 'High (8/10)', status: 'Waiting', urgent: true },
    { time: '08:30', name: 'Gogo Dlamini', id: '540105...', score: 'Medium (4/10)', status: 'In Review', urgent: false },
    { time: '08:45', name: 'Sarah Jones', id: '880523...', score: 'Low (1/10)', status: 'Checked In', urgent: false },
  ];

  const handleReview = (patient: any) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Topbar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800">Clinic Dashboard / Triage Queue</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <Input className="pl-9 w-64 bg-slate-50" placeholder="Search patient ID..." />
          </div>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-6 overflow-auto flex-1">
        <div className="rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>AI Triage Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-slate-50/50" onClick={() => handleReview(patient)}>
                  <TableCell className="font-medium">{patient.time}</TableCell>
                  <TableCell className="font-semibold text-slate-700">{patient.name}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{patient.id}</TableCell>
                  <TableCell>
                    <Badge variant={patient.urgent ? 'destructive' : 'secondary'} className={!patient.urgent ? 'bg-blue-50 text-blue-700' : ''}>
                      {patient.score}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${patient.urgent ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span>{patient.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Verification Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>Review Triage: {selectedPatient?.name}</DialogTitle>
            <p className="text-sm text-slate-500">ID: {selectedPatient?.id} • Symptoms reported 15m ago</p>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden h-[500px]">
            {/* Left: Doctor Notes */}
            <div className="w-1/2 p-6 border-r flex flex-col space-y-4">
              <h4 className="font-semibold flex items-center"><Stethoscope className="w-4 h-4 mr-2" /> Doctor's Assessment</h4>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-medium text-slate-500">Clinical Notes</label>
                <Textarea 
                  className="h-full resize-none p-4 text-sm focus:ring-teal-600" 
                  placeholder="Enter clinical observations..." 
                  defaultValue="Patient presents with high fever and reported chest pain. BP 145/90." 
                />
              </div>
            </div>

            {/* Right: AI Summary */}
            <div className="w-1/2 p-6 bg-sky-50/50 flex flex-col space-y-4">
              <h4 className="font-semibold flex items-center text-teal-800"><BrainCircuit className="w-4 h-4 mr-2" /> AI Summary (Llama 3)</h4>
              
              <div className="bg-white p-4 rounded-lg border border-sky-100 shadow-sm space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis</span>
                  <p className="text-slate-700 mt-1">
                    Keywords match <span className="font-semibold text-red-600">Acute Respiratory Infection</span> protocol. 
                    Patient language indicates urgency ("can't breathe").
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Action</span>
                  <div className="flex items-center space-x-2 mt-1 text-teal-700 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Prioritize for immediate vitals</span>
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
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowModal(false)}>Approve & Admit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}