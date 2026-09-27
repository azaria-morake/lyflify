import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());

  const { data: notifications = [] } = useQuery({
    queryKey: ['patientNotifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/booking/notifications/demo_user');
        return res.data || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 3000
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Real-time Push Notification Alert
  useEffect(() => {
    notifications.forEach((n: any) => {
      if (!n.read && n.type === 'appointment_approved' && !alertedIds.has(n.id)) {
        setAlertedIds(prev => new Set(prev).add(n.id));
        toast.success("Appointment Approved! 📅", {
          description: `${n.doctor_name || 'Dr. Zulu'} has confirmed your visit for ${n.doctor_time || '10:30'}. Tap to view schedule in Visits.`,
          action: {
            label: "Open Visits",
            onClick: () => {
              markReadMutation.mutate(n.id);
              navigate('/visits');
            }
          },
          duration: 8000
        });
      }
    });
  }, [notifications]);

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
    setOpen(false);
    navigate(item.link || '/visits');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative p-2 rounded-full hover:bg-slate-100 transition-all text-slate-600 flex items-center justify-center ${className || ''}`}
        title="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-[#0A7D6F]' : 'text-slate-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#E04030] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-5 bg-white shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0A7D6F]/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#0A7D6F]" />
                </div>
                <DialogTitle className="text-base font-bold text-slate-900">Notifications</DialogTitle>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[11px] text-[#0A7D6F] h-7 px-2 hover:bg-teal-50"
                  onClick={() => markReadMutation.mutate(undefined)}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Clinic updates & appointment booking confirmations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((item: any) => (
                <div
                  key={item.id || Math.random()}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !item.read 
                      ? 'border-[#0A7D6F]/40 bg-teal-50/40 shadow-xs' 
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0A7D6F] shrink-0" />
                      <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                    </div>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#0A7D6F]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                    <Button
                      size="sm"
                      className="bg-[#0A7D6F] hover:bg-[#086b5e] text-white text-[11px] font-bold h-7 px-2.5 rounded-lg"
                      onClick={() => handleAction(item)}
                    >
                      Check Visits <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
