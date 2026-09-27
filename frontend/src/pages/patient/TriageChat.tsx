import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, User, RefreshCcw, ArrowLeft, ShieldCheck, Sparkles, Stethoscope, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { SindiLogo, SendIcon } from '@/assets/sindiAssets';
import NotificationBell from '@/components/NotificationBell';

type TriageData = {
  urgency_score: number;
  color_code: string;
  category: string;
  recommended_action: string;
};

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  triageResult?: TriageData; 
  agentActions?: string[];
  bookingConfirmed?: boolean;
};

export default function TriageChat() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('sindi_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: Message) => {
            if (m.content && m.content.includes("I've cleared our chat")) {
              return { ...m, content: "Molo! How can I help you today?" };
            }
            return m;
          });
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [{ 
      id: 1, 
      role: 'assistant', 
      content: `Molo! How can I help you today?` 
    }];
  });
  
  const [input, setInput] = useState('');
  const [bookingSent, setBookingSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sindi_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const clearChat = () => {
    const resetMsg: Message[] = [{ 
      id: Date.now(), 
      role: 'assistant', 
      content: `Molo! How can I help you today?` 
    }];
    setMessages(resetMsg);
    setBookingSent(false);
    localStorage.removeItem('sindi_chat_history');
  };

  const chatMutation = useMutation({
    mutationFn: async (history: Message[]) => {
      const apiHistory = history.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/triage/assess', {
        patient_id: "demo_user",
        patient_name: user?.name || "Patient",
        history: apiHistory
      });
      return res.data;
    },
    onSuccess: (data) => {
      const botMsg: Message = {
        id: Date.now(),
        role: 'assistant',
        content: data.reply_message,
        agentActions: data.agent_actions_taken,
        bookingConfirmed: data.booking_confirmed,
        triageResult: data.show_booking ? {
          urgency_score: data.urgency_score,
          color_code: data.color_code,
          category: data.category,
          recommended_action: data.recommended_action
        } : undefined
      };
      setMessages(prev => [...prev, botMsg]);
    },
    onError: () => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'assistant', 
        content: "⚠️ Network Error: I couldn't reach the clinic server. Please check your connection and try again." 
      }]);
    }
  });

  const bookingMutation = useMutation({
    mutationFn: async (triageData: any) => {
      const transcriptText = messages
        .map(m => `${m.role === 'user' ? (user?.name || 'Patient') : 'Nurse Sindi'}: ${m.content}`)
        .join("\n\n");
      const latestUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || "High fever, chest cough, headache";
      await api.post('/booking/create', {
        patient_id: "demo_user",
        patient_name: user?.name || "Thandi Khumalo",
        triage_score: triageData?.color_code || "orange", 
        symptoms: latestUserMsg,
        transcript: transcriptText
      });
    },
    onSuccess: () => {
      setBookingSent(true);
      const confirmMsg: Message = {
        id: Date.now(),
        role: 'assistant',
        content: `Sawubona ${user?.name ? user.name.split(' ')[0] : 'there'}! I have submitted your booking request and triage transcript to the clinic team. I'll alert you under Notifications the moment your booking is confirmed, so you can go on with your day!`
      };
      setMessages(prev => [...prev, confirmMsg]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    chatMutation.mutate(newHistory);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] relative">
      
      {/* Sindi Top Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="md:hidden -ml-2 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="w-10 h-10 rounded-full bg-[#0A7D6F] p-0.5 flex items-center justify-center shrink-0 shadow-sm border border-white">
            <img 
              src={SindiLogo} 
              alt="Sindi" 
              className="w-full h-full object-contain rounded-full" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-[#053B36] text-base leading-tight">Sindi</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              AI Health Assistant • Sindi Care
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            className="text-slate-500 hover:text-[#E04030] hover:bg-red-50 text-xs rounded-full px-3"
            title="Restart Conversation"
          >
            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Trust & Safety Banner */}
      <div className="bg-[#EAF5F3] px-4 py-1.5 border-b border-[#0A7D6F]/10 flex items-center justify-center gap-1.5 text-[11px] text-[#0A7D6F] font-semibold shrink-0">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Confidential & Secure Health Consultation</span>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#0A7D6F] p-0.5 flex items-center justify-center mr-2 shrink-0 shadow-sm border border-white">
                <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
              </div>
            )}

            <div className={`max-w-[82%] rounded-[20px] p-3.5 text-sm shadow-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#0A7D6F] text-white rounded-br-xs' 
                : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
            }`}>
              {/* Autonomous Agent Tool Execution Badges */}
              {msg.agentActions && msg.agentActions.filter(a => a !== 'submit_triage_response').length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
                  {msg.agentActions.includes('lookup_patient_medical_history') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileText className="w-3 h-3" /> Reviewed Medical History
                    </span>
                  )}
                  {msg.agentActions.includes('check_clinic_queue_status') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" /> Checked Live Queue
                    </span>
                  )}
                  {msg.agentActions.includes('register_patient_in_queue') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <Sparkles className="w-3 h-3" /> Registered in Live Queue
                    </span>
                  )}
                  {msg.agentActions.includes('save_doctor_clinical_briefing') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Stethoscope className="w-3 h-3" /> Prepared Doctor SOAP Briefing
                    </span>
                  )}
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.triageResult && (
                <Card className={`mt-3 border-l-4 overflow-hidden shadow-sm ${
                  msg.triageResult.color_code === 'red' ? 'border-l-[#E04030] bg-red-50/70 border-red-100' :
                  msg.triageResult.color_code === 'orange' ? 'border-l-amber-500 bg-amber-50/70 border-amber-100' :
                  'border-l-[#0A7D6F] bg-teal-50/70 border-teal-100'
                }`}>
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`uppercase text-[10px] font-bold tracking-wider ${
                        msg.triageResult.color_code === 'red' ? 'border-red-300 text-red-700 bg-white' :
                        'border-[#0A7D6F]/30 text-[#0A7D6F] bg-white'
                      }`}>
                        {msg.triageResult.category}
                      </Badge>
                      {msg.triageResult.color_code === 'red' && <AlertCircle className="w-4 h-4 text-[#E04030]" />}
                      {msg.triageResult.color_code !== 'red' && <CheckCircle2 className="w-4 h-4 text-[#0A7D6F]" />}
                    </div>
                    
                    <p className="text-slate-700 text-xs font-medium">
                      {msg.triageResult.recommended_action}
                    </p>       
       
                    {bookingSent ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                        <span>Booking Request Sent • Awaiting Staff Confirmation</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className={`w-full text-xs h-9 font-bold rounded-xl shadow-sm ${
                          msg.triageResult.color_code === 'red' 
                            ? 'bg-[#E04030] hover:bg-[#c93425] text-white' 
                            : 'bg-[#0A7D6F] hover:bg-[#086b5e] text-white'
                        }`}
                        onClick={() => bookingMutation.mutate(msg.triageResult)}
                        disabled={bookingMutation.isPending}
                      >
                        {bookingMutation.isPending ? "Sending Request..." : "Book Appointment"}
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        
        {chatMutation.isPending && (
          <div className="flex justify-start items-center">
             <div className="w-8 h-8 rounded-full bg-[#0A7D6F] p-0.5 flex items-center justify-center mr-2 shrink-0 shadow-sm border border-white">
                <img src={SindiLogo} alt="Sindi" className="w-full h-full object-contain rounded-full" />
              </div>
             <div className="bg-white border border-slate-200/80 rounded-[20px] px-4 py-3 rounded-bl-xs shadow-sm flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-[#0A7D6F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#0A7D6F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#0A7D6F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shrink-0 z-20 pb-20 md:pb-4">
        <div className="flex gap-2 max-w-4xl mx-auto items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your symptoms..."
            className="flex-1 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0A7D6F] text-slate-800 placeholder:text-slate-400 text-sm"
            disabled={chatMutation.isPending}
          />
          <Button 
            onClick={handleSend} 
            disabled={chatMutation.isPending || !input.trim()}
            className="bg-[#0A7D6F] hover:bg-[#086b5e] h-11 w-11 p-0 rounded-xl shadow-sm text-white shrink-0 flex items-center justify-center active:scale-95 transition-all"
          >
            <img src={SendIcon} alt="Send" className="w-5 h-5 object-contain filter brightness-0 invert" />
          </Button>
        </div>
      </div>
    </div>
  );
}