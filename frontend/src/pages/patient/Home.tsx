import { Activity, Clock, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PatientHome() {
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

      {/* Next Appointment Card */}
      <Card className="shadow-sm border-teal-100/50">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Next Visit</CardTitle>
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              Confirmed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-teal-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Tomorrow, 09:00 AM</p>
              <p className="text-slate-500 text-sm">Dr. Nkosi - General Checkup</p>
            </div>
          </div>
          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-md border border-amber-100">
            Remember to bring your ID book and current medication.
          </div>
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
        <Button size="lg" className="w-full h-12 text-base shadow-teal-900/10 shadow-lg bg-teal-600 hover:bg-teal-700">
          Start Triage Check
        </Button>
      </div>

      {/* Recent Messages */}
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