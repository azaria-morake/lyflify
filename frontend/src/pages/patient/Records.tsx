import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Pill, ChevronDown, ChevronUp, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { SindiLogo, RecordsIcon } from '@/assets/sindiAssets';

const fetchRecords = async () => {
  const response = await api.get('/records/list/demo_user');
  return response.data;
};

export default function PatientRecords() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({}); 

  const { data: records, isLoading } = useQuery({
    queryKey: ['medicalRecords'],
    queryFn: fetchRecords,
  });

  const explainMutation = useMutation({
    mutationFn: async (record: any) => {
      const response = await api.post('/records/explain', {
        diagnosis: record.diagnosis,
        meds: record.meds,
        notes: record.notes
      });
      return response.data.explanation;
    },
    onSuccess: (data, variables) => {
      setExplanations(prev => ({ ...prev, [variables.id]: data }));
    }
  });

  const handleExplain = (record: any) => {
    if (expandedId === record.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(record.id);
    if (!explanations[record.id]) {
      explainMutation.mutate(record);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#FAF7F2] min-h-screen pb-28 md:pb-8">
      {/* Header */}
      <header className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#0A7D6F]/10 flex items-center justify-center shrink-0">
          <img src={RecordsIcon} alt="Records" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Health Records</h1>
          <p className="text-slate-500 text-xs">Medical history & prescriptions secured by Sindi</p>
        </div>
      </header>

      <div className="space-y-4">
        
        {/* --- 1. SKELETON LOADER --- */}
        {isLoading && (
          <>
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-sm border-slate-200 animate-pulse rounded-2xl">
                <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-48 bg-slate-200 rounded mt-3" />
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                    <div className="h-8 w-full bg-slate-100 rounded" />
                    <div className="h-8 w-full bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-12 w-full bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 w-full bg-slate-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* --- 2. EMPTY STATE --- */}
        {(!isLoading && (!records || records.length === 0)) && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No medical records found.</p>
          </div>
        )}

        {/* --- 3. REAL DATA --- */}
        {records?.map((record: any) => (
          <Card key={record.id} className="shadow-sm border-slate-200/80 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="pb-3 bg-[#FAF7F2]/60 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-[#0A7D6F]" />
                  <span className="text-sm font-semibold">{record.date}</span>
                </div>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-semibold">{record.doctor}</Badge>
              </div>
              <CardTitle className="text-lg text-[#053B36] font-bold mt-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#0A7D6F]" />
                {record.diagnosis}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Meds</p>
                {record.meds.map((med: string, idx: number) => (
                  <div key={idx} className="flex items-center text-slate-700 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-sm font-medium">
                    <Pill className="w-4 h-4 mr-2 text-[#0A7D6F]" />
                    {med}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                <p className="text-slate-600 text-sm italic bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">"{record.notes}"</p>
              </div>

              {/* AI EXPLAINER */}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className={`w-full rounded-xl border-[#0A7D6F]/30 ${
                    expandedId === record.id 
                      ? 'bg-[#0A7D6F]/10 text-[#0A7D6F]' 
                      : 'text-[#0A7D6F] hover:bg-[#0A7D6F]/5'
                  }`}
                  onClick={() => handleExplain(record)}
                  disabled={explainMutation.isPending && expandedId === record.id && !explanations[record.id]}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-[#0A7D6F]" />
                  {expandedId === record.id ? "Hide Explanation" : "Sindi Explains in Simple Terms"}
                  {expandedId === record.id ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
                </Button>

                {expandedId === record.id && (
                  <div className="mt-3 bg-[#0A7D6F] text-white p-4 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow">
                        <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-sm text-teal-100 mb-1">Sindi Explains:</p>
                        
                        {explanations[record.id] ? (
                           <p className="text-sm leading-relaxed whitespace-pre-line text-white/95">
                             {explanations[record.id]}
                           </p>
                        ) : (
                           <div className="flex items-center text-teal-100 text-sm">
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Translating medical terms into simple advice...
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}