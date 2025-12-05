import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Pill, ChevronDown, ChevronUp, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

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
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white p-6 -mx-4 -mt-4 mb-2 border-b shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">My Health Record</h1>
        <p className="text-slate-500 text-sm">Your history & prescriptions</p>
      </header>

      <div className="space-y-4">
        
        {/* --- 1. SKELETON LOADER --- */}
        {isLoading && (
          <>
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-sm border-slate-200 animate-pulse">
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
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No medical records found.</p>
          </div>
        )}

        {/* --- 3. REAL DATA --- */}
        {records?.map((record: any) => (
          <Card key={record.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{record.date}</span>
                </div>
                <Badge variant="outline" className="bg-white">{record.doctor}</Badge>
              </div>
              <CardTitle className="text-lg text-teal-800 mt-2 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {record.diagnosis}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Meds</p>
                {record.meds.map((med: string, idx: number) => (
                  <div key={idx} className="flex items-center text-slate-700 bg-slate-100 p-2 rounded-md text-sm">
                    <Pill className="w-4 h-4 mr-2 text-teal-600" />
                    {med}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                <p className="text-slate-600 text-sm italic">"{record.notes}"</p>
              </div>

              {/* AI EXPLAINER */}
              <div className="pt-2">
                <Button 
                  variant={expandedId === record.id ? "secondary" : "outline"} 
                  className={`w-full border-teal-200 ${expandedId === record.id ? 'bg-teal-50 text-teal-800' : 'text-teal-700 hover:bg-teal-50'}`}
                  onClick={() => handleExplain(record)}
                  disabled={explainMutation.isPending && expandedId === record.id && !explanations[record.id]}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {expandedId === record.id ? "Hide Explanation" : "Explain in Simple English"}
                  {expandedId === record.id ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
                </Button>

                {expandedId === record.id && (
                  <div className="mt-3 bg-teal-600 text-white p-4 rounded-lg shadow-inner animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <BotAvatar /> 
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-sm text-teal-100 mb-1">Nurse Nandiphiwe Explains:</p>
                        
                        {explanations[record.id] ? (
                           <p className="text-sm leading-relaxed whitespace-pre-line">
                             {explanations[record.id]}
                           </p>
                        ) : (
                           <div className="flex items-center text-teal-100 text-sm">
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Translating medical terms...
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

const BotAvatar = () => (
  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
    <Sparkles className="h-5 w-5 text-white" />
  </div>
);