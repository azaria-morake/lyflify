import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Calendar, Clock, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SindiLogo } from '@/assets/sindiAssets';

export default function PatientNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['patientNotifications'],
    queryFn: async () => {
      const res = await api.get('/booking/notifications/demo_user');
      return res.data || [];
    },
    refetchInterval: 3000
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId?: string) => {
      await api.post('/booking/notifications/read', {
        patient_id: 'demo_user',
        notification_id: notifId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientNotifications'] });
    }
  });

  const handleAction = (item: any) => {
    markReadMutation.mutate(item.id);
    if (item.link) {
      navigate(item.link);
    } else {
      navigate('/visits');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#FAF7F2] min-h-screen pb-28 md:pb-8">
      {/* Header */}
      <header className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0A7D6F]/10 flex items-center justify-center shrink-0">
            <Bell className="w-7 h-7 text-[#0A7D6F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-slate-500 text-xs">Alerts, appointment confirmations & clinic updates</p>
          </div>
        </div>

        {notifications && notifications.some((n: any) => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#0A7D6F] font-semibold hover:bg-teal-50"
            onClick={() => markReadMutation.mutate(undefined)}
          >
            Mark all read
          </Button>
        )}
      </header>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 animate-pulse">
            <Bell className="w-8 h-8 mx-auto mb-2 text-[#0A7D6F] animate-bounce" />
            <p className="text-sm font-semibold">Checking for notifications...</p>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#0A7D6F]/10 mx-auto flex items-center justify-center">
              <Bell className="w-8 h-8 text-[#0A7D6F]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No New Notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When clinic staff approve your booking requests or update your appointment schedule, you will receive real-time alerts here.
            </p>
          </div>
        ) : (
          notifications.map((item: any) => (
            <Card 
              key={item.id || Math.random()} 
              className={`rounded-2xl border transition-all ${
                !item.read 
                  ? 'border-[#0A7D6F]/40 bg-white shadow-md ring-1 ring-[#0A7D6F]/20' 
                  : 'border-slate-200/80 bg-white shadow-sm opacity-90'
              }`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5 text-[#0A7D6F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                        {!item.read && (
                          <Badge className="bg-[#0A7D6F] text-white text-[10px] px-2 py-0.5 font-bold uppercase">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-700 text-sm leading-relaxed pl-13">
                  {item.message}
                </p>

                <div className="pt-2 pl-13 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-[#0A7D6F] font-semibold">
                    Attending: {item.doctor_name || 'Dr. Zulu'} • {item.doctor_time || '10:30'}
                  </span>
                  <Button
                    size="sm"
                    className="bg-[#0A7D6F] hover:bg-[#086b5e] text-white text-xs font-bold rounded-xl shadow-sm"
                    onClick={() => handleAction(item)}
                  >
                    Check Visits Tab <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
