import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print"; 
import { 
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, PieChart, Pie, Cell 
} from "recharts";
import { 
  Activity, Clock, Users, TrendingUp, AlertTriangle, ArrowRight, 
  Calendar as CalendarIcon, Download, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";


// --- API FETCHERS ---
const fetchAnalytics = async () => {
  const response = await api.get('/navigator/analytics');
  return response.data;
};

// NEW: Real AI Fetcher
const fetchAIInsights = async (metrics: any) => {
  // Pass the metrics to the backend LLM service
  const response = await api.post('/navigator/analytics/insights', { metrics });
  return response.data;
};

const fetchQueue = async () => {
  const response = await api.get('/queue');
  return response.data;
};

// --- HELPERS ---
const getScore = (patient: any): number => {
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

const getIconProps = (type: string) => {
  switch(type) {
    case 'time': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' };
    case 'users': return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'alert': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
    default: return { icon: Activity, color: 'text-teal-600', bg: 'bg-teal-100' };
  }
};

// --- COMPONENT ---
export default function ClinicAnalytics() {
  const [filterType, setFilterType] = useState<'all' | 'critical' | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true); // Open by default to show off AI
  
  // Ref for Printing
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Analytics Aggregates
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['clinicAnalytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 10000, // Slowed down slightly to give AI breathing room
  });

  // 2. AI Mutation (Replaces the old useMemo)
  const { 
    data: aiInsights, 
    mutate: generateInsights, 
    isPending: loadingInsights 
  } = useMutation({
    mutationFn: fetchAIInsights,
  });

  // 3. Automatically trigger AI when analytics data arrives
  useEffect(() => {
    if (analytics?.metrics) {
      generateInsights(analytics.metrics);
    }
  }, [analytics]);

  // 4. Fetch Raw Queue (For Drill-down)
  const { data: queue } = useQuery({
    queryKey: ['liveQueue'],
    queryFn: fetchQueue,
    refetchInterval: 5000,
  });

  // 5. Filter Logic
  const filteredQueue = useMemo(() => {
    if (!queue || !filterType) return [];
    if (filterType === 'all') return queue;
    if (filterType === 'critical') {
      return queue.filter((p: any) => p.urgent || (typeof p.score === 'string' && p.score.includes('High')) || getScore(p) >= 8);
    }
    return [];
  }, [queue, filterType]);

  const handleCardClick = (type: string) => {
    if (type === 'users') setFilterType('all');
    if (type === 'alert') setFilterType('critical');
  };

  // PRINT HANDLER
  const handlePrint = useReactToPrint({
    contentRef: contentRef, 
    documentTitle: `LyfLify_Report_${new Date().toISOString().split('T')[0]}`,
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Scrollable Container (Attached Ref here) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={contentRef}>
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-teal-600" />
              Facility Analytics
            </h2>
            <p className="text-slate-500 text-sm">Real-time overview of Soweto North Clinic</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-xs h-9 bg-white">
              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-500" />
              Today: {new Date().toLocaleDateString()}
            </Button>
            
            {/* EXPORT BUTTON */}
            <Button 
              variant="outline" 
              onClick={() => handlePrint()} 
              className="text-xs h-9 bg-white hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 mr-2 text-slate-500" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* --- 1. AI INSIGHTS (REAL) --- */}
        {!loadingAnalytics && (
          <Card className="border-teal-100 bg-teal-50/50 shadow-sm transition-all duration-300">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsInsightsOpen(!isInsightsOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-teal-800 flex items-center uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Llama 3 Operational Insights
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-teal-100">
                  {isInsightsOpen ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4 text-teal-700" />}
                </Button>
              </div>
            </CardHeader>
            
            {/* Collapse Logic */}
            {isInsightsOpen && (
              <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                {/* FIX: Added max-h and overflow to prevent infinite expansion */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {loadingInsights ? (
                    <div className="flex items-center p-4 text-sm text-teal-600/80">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing metrics...
                    </div>
                  ) : aiInsights && aiInsights.length > 0 ? (
                    aiInsights.map((insight: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-white p-3 rounded border border-teal-100/50 shadow-sm">
                        <div className={`mt-0.5 ${insight.type === 'critical' || insight.type === 'warning' ? 'text-red-500' : 'text-teal-500'}`}>
                          {insight.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                        </div>
                        <p className="text-sm text-slate-700">{insight.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-400 italic">No insights available yet.</div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* --- 2. METRICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingAnalytics ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm border-slate-200 animate-pulse">
                <CardContent className="p-6 h-[100px] bg-white rounded-lg flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                    <div className="h-8 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="h-12 w-12 bg-slate-100 rounded-xl" />
                </CardContent>
              </Card>
            ))
          ) : (
            analytics?.metrics.map((metric: any, i: number) => {
              const { icon: Icon, color, bg } = getIconProps(metric.type);
              const isClickable = metric.type === 'users' || metric.type === 'alert';
              
              return (
                <Card 
                  key={i} 
                  className={`shadow-sm border-slate-200 transition-all duration-200 bg-white ${
                    isClickable ? 'cursor-pointer hover:shadow-md hover:border-teal-200 group' : ''
                  }`}
                  onClick={() => isClickable && handleCardClick(metric.type)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 flex items-center">
                        {metric.label}
                        {isClickable && <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />}
                      </p>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <h3 className="text-2xl font-bold text-slate-900">{metric.value}</h3>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          {metric.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${bg}`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* --- 3. CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Patient Inflow</CardTitle>
              <CardDescription>Live hourly check-ins</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loadingAnalytics ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-md flex items-center justify-center text-slate-300">Loading Chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.hourly_traffic}>
                    <defs>
                      <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="patients" 
                      stroke="#0d9488" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPatients)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Triage Categories</CardTitle>
              <CardDescription>Current queue distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] relative">
              {loadingAnalytics ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-full scale-75 opacity-50" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.diagnosis_data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics?.diagnosis_data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center flex-wrap gap-3 px-4 text-xs">
                    {analytics?.diagnosis_data.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600 font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- DRILL DOWN MODAL (Placed outside overflow container) --- */}
      <Dialog open={!!filterType} onOpenChange={(open) => !open && setFilterType(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {filterType === 'critical' ? (
                <>
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                  <span className="text-red-700">Critical Cases</span>
                </>
              ) : (
                <>
                  <Users className="text-blue-600 w-5 h-5" />
                  <span className="text-slate-800">Active Patient Queue</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto flex-1 mt-4 border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      No patients found for this category.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueue.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{p.time}</span>
                          <span className="text-[10px] text-slate-400">{getWaitTime(p.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{p.patient_name || p.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={p.urgent || (p.score && p.score.toString().includes('High')) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600'}
                        >
                          {p.score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-500 font-medium uppercase">{p.status}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}