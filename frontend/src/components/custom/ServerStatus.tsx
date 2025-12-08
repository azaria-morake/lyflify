import { useState, useEffect } from 'react';
import { Loader2, CloudLightning, Database, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MESSAGES = [
  { text: "Establishing secure connection...", icon: CloudLightning },
  { text: "Waking up secure database...", icon: Database },
  { text: "Syncing latest patient records...", icon: Radio },
  { text: "Almost there...", icon: Loader2 },
];

export function ServerStatus() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % MESSAGES.length);
    }, 3000); // Change message every 3 seconds
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = MESSAGES[step].icon;

  return (
    <Card className="w-full h-64 flex items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
      <CardContent className="flex flex-col items-center text-center p-6 space-y-4 animate-in fade-in duration-500">
        
        {/* Animated Icon Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-teal-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-teal-100">
            <CurrentIcon className="h-8 w-8 text-teal-600 animate-pulse" />
          </div>
        </div>

        {/* Dynamic Text */}
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 text-lg transition-all duration-300">
            {MESSAGES[step].text}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Connecting to Render (Free Tier)...
          </p>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '50%' }} />
        </div>

      </CardContent>
    </Card>
  );
}
