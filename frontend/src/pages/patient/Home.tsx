import { Link } from 'react-router-dom';
import { Activity, Clock, Bot, MapPin, AlertTriangle, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const fetchCarePath = async () => {
  // Simulating location data
  const response = await api.post('/navigator/calculate', {
    patient_location: "Soweto, Zone 6",
    transport_type: "Taxi"
  });
  return response.data;
};

export default function PatientHome() {
  const { data: route, isLoading, error } = useQuery({
    queryKey: ['carePath'],
    queryFn: fetchCarePath,
    refetchInterval: 10000, 
  });

  const isDelayed = route?.clinic_status === "Delayed";

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="bg-white p-6 -mx-4 -mt-4 mb-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sawubona, Gogo</h1>
            <p className="text-slate-500 text-sm">Welcome back to LyfLify</p>
          </div>
          <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold border border-teal-200">
            GD
          </div>
        </div>
      </header>

      {/* Smart Navigator Card */}
      <Card className={`shadow-sm transition-colors duration-500 ${isDelayed ? 'border-amber-200 bg-amber-50/30' : 'border-teal-100/50'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Next Visit</CardTitle>
            
            {isLoading ? (
              <Badge variant="outline" className="animate-pulse">Syncing...</Badge>
            ) : (
              <Badge variant={isDelayed ? 'destructive' : 'secondary'} className={isDelayed ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}>
                {route?.clinic_status || "Confirmed"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-20 bg-slate-100 animate-pulse rounded-md" />
          ) : error ? (
            <div className="text-red-500 text-sm">Offline. Appointment at 09:00 AM.</div>
          ) : (
            <div className="space-y-4">
              
              {/* Dynamic Time Section */}
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${isDelayed ? 'bg-amber-100' : 'bg-teal-50'}`}>
                  {isDelayed ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : <Clock className="w-6 h-6 text-teal-600" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-lg">
                    Arrive at {route.estimated_start_time}
                  </p>
                  <p className="text-slate-500 text-sm">
                     You are #{route.queue_position} in the queue
                  </p>
                </div>
              </div>

              {/* Static Context Section */}
              <div className="pl-1 border-l-2 border-slate-100 ml-6 py-1 space-y-1">
                 <div className="flex items-center text-sm font-medium text-slate-700 ml-4">
                    <UserRound className="w-4 h-4 mr-2 text-slate-400" />
                    Dr. Nkosi - General Checkup
                 </div>
                 <div className="ml-4 text-xs text-slate-500">
                    Soweto North Clinic, Room 4
                 </div>
              </div>

              {/* Navigator Bubble */}
              <div className={`text-xs p-3 rounded-md border flex gap-2 items-start ${isDelayed ? 'bg-white border-amber-200 text-amber-900' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Traffic Update:</strong> {route.traffic_note}
                </span>
              </div>

              {/* Static Reminder */}
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-md border border-amber-100">
                Remember to bring your ID book and current medication.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage Action */}
      <div className="bg-white p-6 rounded-xl border shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Feeling Unwell?</h3>
          <p className="text-slate-500 text-sm">Tell us your symptoms before you come to the clinic.</p>
        </div>
       <Link to="/triage" className="block w-full"> {/* Wrap button in Link */}
        <Button size="lg" className="w-full h-12 text-base shadow-teal-900/10 shadow-lg bg-teal-600 hover:bg-teal-700">
          Start Triage Check
        </Button>
       </Link>
      </div>

      {/* Recent Updates */}
      <div className="space-y-3 pb-4">
        <h3 className="font-semibold text-slate-700 px-1">Recent Updates</h3>
        <div className="bg-white p-4 rounded-xl border flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-full">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">LyfLify AI Assistant</p>
            <p className="text-xs text-slate-500 truncate">Your blood pressure results are ready...</p>
          </div>
          <span className="text-[10px] text-slate-400">2m ago</span>
        </div>
      </div>
    </div>
  );
}
