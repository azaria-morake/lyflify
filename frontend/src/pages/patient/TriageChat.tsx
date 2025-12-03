import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  triageResult?: {
    color_code: string;
    category: string;
    recommended_action: string;
  };
};

export default function TriageChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Sawubona! I am the LyfLify Triage Assistant. Please tell me what symptoms you are feeling today.", 
      sender: 'bot' 
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  // Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: async (triageData: any) => {
      await api.post('/booking/create', {
        patient_id: "demo_user", // In real app, get from auth store
        patient_name: "Gogo Dlamini", // In real app, get from auth store
        triage_score: triageData.color_code,
        symptoms: messages.find(m => m.sender === 'user')?.text || "Reported via Chat"
      });
    },
    onSuccess: () => {
      // Redirect back to Home so they see the updated Smart Card
      navigate('/'); 
    }
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // API Mutation
  const triageMutation = useMutation({
    mutationFn: async (symptoms: string) => {
      const res = await api.post('/triage/assess', {
        patient_id: "demo_user", // In real app, get from auth store
        symptoms: symptoms
      });
      return res.data;
    },
    onSuccess: (data) => {
      const botResponse: Message = {
        id: Date.now(),
        text: data.ai_reasoning,
        sender: 'bot',
        triageResult: data 
      };
      setMessages(prev => [...prev, botResponse]);
    },
    onError: () => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: "I'm having trouble connecting to the clinic. Please try again or go directly to the front desk.", 
        sender: 'bot' 
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add User Message
    const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    // Trigger AI
    triageMutation.mutate(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center shadow-sm sticky top-0 z-10">
        <div className="bg-teal-100 p-2 rounded-full mr-3">
          <Bot className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Triage Assistant</h2>
          <p className="text-xs text-slate-500">AI-Powered Check-in</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
              msg.sender === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
            }`}>
              <p>{msg.text}</p>

              {/* Dynamic Triage Card (Only shows if bot returns a result) */}
              {msg.triageResult && (
                <Card className={`mt-3 border-l-4 ${
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
                    <p className="font-bold text-slate-800 mb-1">Recommended Action:</p>
                    <p className="text-slate-600 italic">{msg.triageResult.recommended_action}</p>       
       
                    {/* THE ACTION BUTTON */}
                    <Button 
                      size="sm" 
                      className={`w-full ${
                        msg.triageResult.color_code === 'red' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                      onClick={() => bookingMutation.mutate(msg.triageResult)}
                      disabled={bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? "Confirming..." : 
                         msg.triageResult.color_code === 'red' ? "Notify Clinic: Emergency" : "Book Next Slot"
                      }
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {triageMutation.isPending && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-200 rounded-2xl p-3 rounded-bl-none shadow-sm flex space-x-1 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t pb-24"> {/* Extra padding for bottom nav */}
        <div className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your symptoms..."
            className="flex-1"
            disabled={triageMutation.isPending}
          />
          <Button 
            onClick={handleSend} 
            disabled={triageMutation.isPending || !input.trim()}
            className="bg-teal-600 hover:bg-teal-700 w-12 px-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
