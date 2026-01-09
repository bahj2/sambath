import { useState } from "react";
import { Mic, MicOff, Volume2, Settings, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveVoiceProps {
  isPro: boolean;
}

export function LiveVoice({ isPro }: LiveVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', text: string}>>([
    { role: 'ai', text: 'Hello! I\'m your AI voice assistant. Click the microphone to start speaking.' }
  ]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate listening
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'user', text: 'Hello, how are you today?' }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: 'I\'m doing great, thank you for asking! How can I help you today?' }]);
        }, 1000);
      }, 2000);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Native Voice Chat</h2>
          <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Real-time AI Conversation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className={cn("w-4 h-4", isListening ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {isListening ? "Listening" : "Standby"}
            </span>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-8">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl",
              message.role === 'user' 
                ? "bg-primary text-primary-foreground rounded-br-sm" 
                : "bg-secondary text-foreground rounded-bl-sm"
            )}>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Voice Controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Visualizer */}
        <div className="flex items-center gap-1 h-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-primary/30 rounded-full transition-all duration-150",
                isListening && "bg-primary animate-pulse"
              )}
              style={{
                height: isListening ? `${Math.random() * 60 + 10}px` : '8px',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>

        {/* Mic Button */}
        <button
          onClick={toggleListening}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
            isListening 
              ? "bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]" 
              : "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105"
          )}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>

        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {isListening ? "Tap to stop" : "Tap to speak"}
        </p>
      </div>
    </div>
  );
}