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

// --- API FETCHERS ---
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

  // 1. Get List of Patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['allPatients'],
    queryFn: fetchPatients,
  });

  // 2. Get History for Selected Patient (Enabled only when clicked)
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
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <User className="w-5 h-5 mr-2 text-teal-600" />
          Patient Registry
        </h2>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input 
            className="pl-9 w-64 bg-slate-50" 
            placeholder="Search registry..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Patient List */}
      <div className="p-6 overflow-auto flex-1">
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
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
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">Loading Registry...</TableCell>
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

      {/* History Sheet (Right Sidebar) */}
      <Sheet open={!!selectedPatientId} onOpenChange={() => setSelectedPatientId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Medical History</SheetTitle>
            <SheetDescription>
              Past consultations and treatments.
            </SheetDescription>
          </SheetHeader>

          {loadingHistory ? (
            <div className="text-center py-10 text-slate-400">Loading history...</div>
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