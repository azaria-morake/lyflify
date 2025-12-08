import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle, CheckCircle2, User, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

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
};

export default function TriageChat() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('lyflify_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [{ 
      id: 1, 
      role: 'assistant', 
      content: `Sawubona ${user?.name || "there"}! I'm Nurse Nandiphiwe. How are you feeling today?` 
    }];
  });
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('lyflify_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const clearChat = () => {
    const resetMsg: Message[] = [{ 
      id: Date.now(), 
      role: 'assistant', 
      content: `Sawubona! I've cleared our chat. How can I help you now?` 
    }];
    setMessages(resetMsg);
    localStorage.removeItem('lyflify_chat_history');
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
        content: "⚠️ Network Error: I couldn't reach the clinic. Please check your internet and try again." 
      }]);
    }
  });

  const bookingMutation = useMutation({
    mutationFn: async (triageData: any) => {
      await api.post('/booking/create', {
        patient_id: "demo_user",
        patient_name: user?.name || "Gogo Dlamini",
        triage_score: triageData.color_code, 
        symptoms: messages[messages.length - 2]?.content || "Chat Consultation"
      });
    },
    onSuccess: () => {
      navigate('/');
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
    // FIX: Full height Flex column. No internal scrolling on the root.
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Header - Stays at top */}
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center">
          <div className="bg-teal-100 p-2 rounded-full mr-3">
            <Bot className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Nurse Nandi</h2>
            <p className="text-xs text-slate-500">AI Triage Assistant</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearChat}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50"
          title="Restart Conversation"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Area - THE ONLY THING THAT SCROLLS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 shrink-0">
                <Bot className="w-4 h-4 text-teal-700" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
            }`}>
              <p>{msg.content}</p>

              {msg.triageResult && (
                <Card className={`mt-3 border-l-4 overflow-hidden ${
                  msg.triageResult.color_code === 'red' ? 'border-l-red-500 bg-red-50' :
                  msg.triageResult.color_code === 'orange' ? 'border-l-orange-500 bg-orange-50' :
                  'border-l-green-500 bg-green-50'
                }`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-white uppercase text-xs font-bold">
                        {msg.triageResult.category}
                      </Badge>
                      {msg.triageResult.color_code === 'red' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      {msg.triageResult.color_code === 'green' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-slate-600 text-xs italic mb-3">
                      {msg.triageResult.recommended_action}
                    </p>       
                    <Button 
                      size="sm" 
                      className={`w-full text-xs h-8 ${
                        msg.triageResult.color_code === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      onClick={() => bookingMutation.mutate(msg.triageResult)}
                      disabled={bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? "Booking..." : "Book Visit Now"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 shrink-0">
                <User className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}
        
        {chatMutation.isPending && (
          <div className="flex justify-start items-center">
             <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2">
                <Bot className="w-4 h-4 text-teal-700" />
              </div>
             <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Stagnant at bottom with padding for mobile nav */}
      <div className="p-4 bg-white border-t shrink-0 z-20 pb-24 md:pb-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your symptoms..."
            className="flex-1 focus-visible:ring-teal-600"
            disabled={chatMutation.isPending}
          />
          <Button 
            onClick={handleSend} 
            disabled={chatMutation.isPending || !input.trim()}
            className="bg-teal-600 hover:bg-teal-700 w-12 px-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}