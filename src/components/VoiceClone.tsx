import { useState, useEffect, useRef } from "react";
import { Mic, Upload, Play, Pause, Volume2, Wand2, Download, Loader2, Sparkles, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
interface VoiceCloneProps {
  isPro: boolean;
}
interface ClonedVoice {
  voice_id: string;
  name: string;
  description?: string;
  category?: string;
  preview_url?: string;
}
const languages = [{
  code: "km",
  name: "Khmer",
  flag: "🇰🇭"
}, {
  code: "en",
  name: "English",
  flag: "🇺🇸"
}, {
  code: "vi",
  name: "Vietnamese",
  flag: "🇻🇳"
}, {
  code: "zh",
  name: "Chinese",
  flag: "🇨🇳"
}, {
  code: "ja",
  name: "Japanese",
  flag: "🇯🇵"
}, {
  code: "ko",
  name: "Korean",
  flag: "🇰🇷"
}, {
  code: "es",
  name: "Spanish",
  flag: "🇪🇸"
}, {
  code: "fr",
  name: "French",
  flag: "🇫🇷"
}, {
  code: "de",
  name: "German",
  flag: "🇩🇪"
}];
export function VoiceClone({
  isPro
}: VoiceCloneProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [testText, setTestText] = useState("សួស្តី! នេះគឺជាសម្លេងក្លូនរបស់ខ្ញុំ។");
  const [selectedLanguage, setSelectedLanguage] = useState("km");
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [selectedVoiceForTest, setSelectedVoiceForTest] = useState<string | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    fetchClonedVoices();
  }, []);
  const fetchClonedVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("elevenlabs-voices");
      if (error) throw error;
      const cloned = (data.voices || []).filter((v: ClonedVoice) => v.category === "cloned");
      setClonedVoices(cloned);
      if (cloned.length > 0 && !selectedVoiceForTest) {
        setSelectedVoiceForTest(cloned[0].voice_id);
      }
    } catch (error) {
      console.error("Failed to fetch voices:", error);
      toast.error("Failed to load cloned voices");
    } finally {
      setIsLoadingVoices(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setAudioFile(file);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("audio/")) {
        toast.error("Please upload an audio file");
        return;
      }
      setAudioFile(file);
    }
  };
  const handleClone = async () => {
    if (!audioFile || !voiceName) {
      toast.error("Please provide audio sample and voice name");
      return;
    }
    setIsCloning(true);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("name", voiceName);
      formData.append("description", voiceDescription);
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);
      const {
        data,
        error
      } = await supabase.functions.invoke("elevenlabs-voice-clone", {
        body: formData
      });
      clearInterval(progressInterval);
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setProgress(100);
      toast.success(`Voice "${voiceName}" cloned successfully!`);
      setAudioFile(null);
      setVoiceName("");
      setVoiceDescription("");
      await fetchClonedVoices();
    } catch (error) {
      console.error("Clone error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clone voice");
    } finally {
      setIsCloning(false);
      setProgress(0);
    }
  };
  const handleTestVoice = async () => {
    if (!selectedVoiceForTest || !testText.trim()) {
      toast.error("Please select a voice and enter test text");
      return;
    }
    setIsGeneratingTest(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("elevenlabs-tts", {
        body: {
          text: testText,
          voice_id: selectedVoiceForTest
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const audioData = data.audio;
      const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], {
        type: "audio/mpeg"
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      toast.success("Test audio generated!");
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate test audio");
    } finally {
      setIsGeneratingTest(false);
    }
  };
  const playPreview = (voiceId: string, previewUrl?: string) => {
    if (!previewUrl) {
      toast.error("No preview available for this voice");
      return;
    }
    if (isPlaying === voiceId) {
      audioRef.current?.pause();
      setIsPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play();
        setIsPlaying(voiceId);
      }
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-y-auto custom-scrollbar">
      <audio ref={audioRef} onEnded={() => setIsPlaying(null)} className="hidden" />
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: "1s"
      }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>
      
      <div className="relative p-6 lg:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest"> VOICE CLONING</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Bio-Vocal{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Clone </span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Clone any voice with a short audio sample using AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Upload & Clone */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="group p-6 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl shadow-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 animate-fade-in" style={{
            animationDelay: "100ms"
          }}>
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-colors">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                Upload Voice Sample
              </h3>
              
              {/* Voice Name Input */}
              <div className="space-y-4">
                <div className="relative">
                  <input type="text" value={voiceName} onChange={e => setVoiceName(e.target.value)} placeholder="Voice name (e.g., 'My Voice Clone')" className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60" />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                </div>

                <input type="text" value={voiceDescription} onChange={e => setVoiceDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60" />
              </div>

              {/* Upload Zone */}
              <div className="relative mt-5" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <input type="file" accept="audio/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={cn("h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300", isDragging ? "border-primary bg-primary/10 scale-[1.02]" : audioFile ? "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-500/10" : "border-border/50 hover:border-primary/40 hover:bg-primary/5")}>
                  {audioFile ? <div className="text-center animate-scale-in">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-primary/10">
                        <AudioWaveform className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div> : <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/10 transition-colors">
                        <Mic className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Drop audio file here</p>
                      <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A (max 10MB)</p>
                    </div>}
                </div>
              </div>

              {/* Progress */}
              {isCloning && <div className="mt-5 space-y-3 animate-fade-in">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Cloning voice with ElevenLabs...
                    </span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-2" />
                    <div className="absolute top-0 h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full transition-all duration-300" style={{
                  width: `${progress}%`
                }} />
                  </div>
                </div>}

              {/* Clone Button */}
              <Button onClick={handleClone} disabled={!audioFile || !voiceName || isCloning} className="w-full mt-5 h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none">
                {isCloning ? <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cloning Voice...
                  </> : <>
                    <Wand2 className="w-5 h-5" />
                    Clone Voice
                  </>}
              </Button>
            </div>

            {/* Test Voice Card */}
            <div className="group p-6 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl shadow-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 animate-fade-in" style={{
            animationDelay: "200ms"
          }}>
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-colors">
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                </div>
                Test Your Clone
              </h3>
              
              {/* Voice Selector */}
              <select value={selectedVoiceForTest || ""} onChange={e => setSelectedVoiceForTest(e.target.value)} style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5rem'
            }} className="w-full px-5 py-4 bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none cursor-pointer rounded-3xl">
                <option value="" disabled>Select a cloned voice</option>
                {clonedVoices.map(voice => <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </option>)}
              </select>

              {/* Language Selector */}
              <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5rem'
            }} className="w-full px-5 py-4 mt-4 bg-secondary/50 border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none cursor-pointer border-2 rounded-3xl">
                {languages.map(lang => <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>)}
              </select>

              <textarea value={testText} onChange={e => setTestText(e.target.value)} className="w-full h-28 mt-4 px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60" placeholder="" />
              
              <Button variant="outline" className="mt-4 h-12 px-6 rounded-2xl border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all" onClick={handleTestVoice} disabled={!selectedVoiceForTest || !testText.trim() || isGeneratingTest}>
                {isGeneratingTest ? <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </> : <>
                    <Volume2 className="w-4 h-4" />
                    Generate Speech
                  </>}
              </Button>
            </div>
          </div>

          {/* Right - Cloned Voices */}
          <div style={{
          animationDelay: "300ms"
        }} className="p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl shadow-primary/5 animate-fade-in h-fit border-8 rounded-4xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <AudioWaveform className="w-5 h-5 text-purple-500" />
                </div>
                Your Cloned Voices
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchClonedVoices} disabled={isLoadingVoices} className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                {isLoadingVoices ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
            
            {isLoadingVoices ? <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <div className="absolute inset-0 w-10 h-10 border-2 border-primary/20 rounded-full animate-ping" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Loading voices...</p>
              </div> : clonedVoices.length > 0 ? <div className="space-y-3">
                {clonedVoices.map((voice, index) => <div key={voice.voice_id} className={cn("group flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer", isPlaying === voice.voice_id && "border-primary/50 bg-primary/10")} style={{
              animationDelay: `${index * 80}ms`,
              animation: "fade-in 0.4s ease-out forwards"
            }} onClick={() => playPreview(voice.voice_id, voice.preview_url)}>
                    <button className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0", isPlaying === voice.voice_id ? "bg-gradient-to-br from-primary to-purple-500 text-primary-foreground shadow-lg shadow-primary/30 scale-110" : "bg-secondary/80 border border-border/50 group-hover:bg-primary/20 group-hover:border-primary/30")}>
                      {isPlaying === voice.voice_id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{voice.name}</p>
                      {voice.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{voice.description}</p>}
                    </div>

                    <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
                      Cloned
                    </span>
                  </div>)}
              </div> : <div className="text-center py-16">
                <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-base font-medium text-foreground">No cloned voices yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload an audio sample to create your first clone
                </p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
}