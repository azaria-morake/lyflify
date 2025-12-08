import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Calendar, FileText, ChevronRight, History } from 'lucide-react'; 
import api from '../../lib/api';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ServerStatus } from '@/components/custom/ServerStatus'; // <--- IMPORT

const fetchPatients = async () => {
  const response = await api.get('/records/all-patients');
  return response.data;
};

const fetchPatientHistory = async (patientId: string) => {
  const response = await api.get(`/records/list/${patientId}`);
  return response.data;
};

export default function ClinicPatients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: fetchPatients,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['patientHistory', selectedPatientId],
    queryFn: () => fetchPatientHistory(selectedPatientId!),
    enabled: !!selectedPatientId,
  });

  const filteredPatients = patients?.filter((p: any) => 
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <User className="w-5 h-5 mr-2 text-teal-600" />
          Patient Registry
        </h2>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input 
            className="pl-9 w-48 md:w-64 bg-slate-50" 
            placeholder="Search registry..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-6 overflow-auto flex-1">
        
        {/* --- MOBILE VIEW: CARDS (Visible md:hidden) --- */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
             <ServerStatus /> // <--- REPLACED TEXT LOADER
          ) : filteredPatients?.length === 0 ? (
             <div className="text-center text-slate-400 py-10">No records found.</div>
          ) : (
            filteredPatients.map((p: any, i: number) => (
              <div 
                key={i} 
                onClick={() => setSelectedPatientId(p.patient_id)}
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 active:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{p.patient_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {p.patient_id}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Last Diagnosis</span>
                    <span className="text-slate-700 font-medium">{p.last_diagnosis}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Last Visit</span>
                    <span className="text-slate-700 font-medium flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-teal-500" /> {p.last_visit}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- DESKTOP VIEW: TABLE (Visible hidden md:block) --- */}
        <div className="hidden md:block rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Last Diagnosis</TableHead>
                <TableHead>Attending Dr.</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-4">
                    <ServerStatus /> {/* <--- REPLACED TEXT LOADER */}
                  </TableCell>
                </TableRow>
              ) : filteredPatients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">No records found.</TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p: any, i: number) => (
                  <TableRow 
                    key={i} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedPatientId(p.patient_id)}
                  >
                    <TableCell className="font-semibold text-slate-700">{p.patient_name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{p.patient_id}</TableCell>
                    <TableCell>{p.last_visit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-100">{p.last_diagnosis}</Badge>
                    </TableCell>
                    <TableCell>{p.last_doctor}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* History Sheet (Responsive Width) */}
      <Sheet open={!!selectedPatientId} onOpenChange={() => setSelectedPatientId(null)}>
        <SheetContent className="w-[90%] sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Medical History</SheetTitle>
            <SheetDescription>
              Past consultations and treatments.
            </SheetDescription>
          </SheetHeader>

          {loadingHistory ? (
            <div className="p-4">
                <ServerStatus /> {/* Re-using it here too for consistency if desired */}
            </div>
          ) : (
            <div className="space-y-6">
              {history?.map((record: any, idx: number) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-200 pb-6 last:pb-0">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-teal-100 border-2 border-teal-500" />
                  
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{record.date}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{record.doctor}</span>
                  </div>
                  
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</div>
                        <div className="text-sm font-medium text-slate-800">{record.diagnosis}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Meds</div>
                        <div className="flex flex-wrap gap-1">
                          {record.meds.map((m: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-white border-slate-200 text-slate-600 font-normal">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</div>
                        <p className="text-xs text-slate-500 italic leading-relaxed">
                          "{record.notes}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}