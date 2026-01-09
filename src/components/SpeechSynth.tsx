import { useState, useRef } from "react";
import { Volume2, Play, Pause, Download, ChevronDown, Sliders, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface SpeechSynthProps {
  isPro: boolean;
}

// Browser voices will be populated dynamically
const defaultVoices = [
  { id: "default", name: "Default", gender: "Neutral", accent: "System" },
];

const languages = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "ja-JP", name: "Japanese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ko-KR", name: "Korean" },
  { code: "km-KH", name: "Khmer" },
  { code: "hi-IN", name: "Hindi" },
  { code: "ar-SA", name: "Arabic" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "it-IT", name: "Italian" },
  { code: "ru-RU", name: "Russian" },
];

export function SpeechSynth({ isPro }: SpeechSynthProps) {
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices
  useState(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  });

  const getVoicesForLanguage = () => {
    return availableVoices.filter(voice => 
      voice.lang.startsWith(selectedLanguage.split('-')[0])
    );
  };

  const handleSpeak = () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in your browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsGenerating(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed[0];
    utterance.pitch = pitch[0];
    utterance.lang = selectedLanguage;

    // Set voice if available
    const langVoices = getVoicesForLanguage();
    if (langVoices.length > 0 && selectedVoiceIndex < langVoices.length) {
      utterance.voice = langVoices[selectedVoiceIndex];
    }

    utterance.onstart = () => {
      setIsGenerating(false);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsGenerating(false);
      setIsSpeaking(false);
      toast.error("Failed to generate speech");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    toast.success("Speaking...");
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsGenerating(false);
  };

  const handleDownload = async () => {
    toast.info("Browser TTS doesn't support direct download. Use the speak button to listen.");
  };

  const langVoices = getVoicesForLanguage();

  return (
    <div className="min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-6 lg:p-10 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Browser TTS Engine
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Speech <span className="gradient-text">Synth Pro</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Natural text-to-speech powered by your browser (no API key required)
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Text Input */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Enter Text</h3>
                <span className="text-xs text-muted-foreground">{text.length} / 5000</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full h-64 px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={5000}
              />
              
              <div className="flex items-center gap-3 mt-4">
                {isSpeaking ? (
                  <Button 
                    onClick={handleStop}
                    variant="destructive"
                    className="flex-1"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Speaking
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSpeak}
                    disabled={!text.trim() || isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Speak Text
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Audio Visualization */}
            {isSpeaking && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border animate-scale-in">
                <h3 className="text-sm font-bold text-foreground mb-4">Now Speaking</h3>
                
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <button
                    onClick={handleStop}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1">
                    {/* Waveform visualization */}
                    <div className="flex items-center gap-0.5 h-10">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-primary animate-pulse"
                          style={{
                            height: `${Math.sin(i * 0.3) * 15 + 20}px`,
                            animationDelay: `${i * 20}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right - Settings */}
          <div className="space-y-6">
            {/* Language */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4">Language</h3>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setSelectedVoiceIndex(0);
                  }}
                  className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Voice Selection */}
            {langVoices.length > 0 && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Voice ({langVoices.length} available)
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {langVoices.map((voice, index) => (
                    <button
                      key={voice.name}
                      onClick={() => setSelectedVoiceIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                        selectedVoiceIndex === index 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-secondary/50 border border-transparent hover:bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        selectedVoiceIndex === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {voice.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.lang}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Settings */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Speed</span>
                    <span className="text-foreground font-medium">{speed[0].toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Pitch</span>
                    <span className="text-foreground font-medium">{pitch[0].toFixed(1)}</span>
                  </div>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
