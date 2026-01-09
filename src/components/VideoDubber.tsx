import { useState, useEffect, useRef } from "react";
import { Upload, Film, Play, ArrowRight, Globe2, ChevronDown, Check, Loader2, Download, RefreshCw, AlertCircle, Clock, Zap, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
interface DubbingHistoryItem {
  id: string;
  dubbing_id: string;
  duration_seconds: number;
  target_language: string;
  file_name: string | null;
  created_at: string;
}
interface VideoDubberProps {
  isPro: boolean;
}
interface DubbingJob {
  dubbing_id: string;
  status: string;
  target_languages: string[];
  expected_duration_sec?: number;
}
const MONTHLY_LIMIT_MINUTES = 25;

// Source languages with auto-detect option
const sourceLanguages = [
  { code: "auto", name: "Auto Detect", flag: "🔍" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
  { code: "el", name: "Greek", flag: "🇬🇷" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "fi", name: "Finnish", flag: "🇫🇮" },
  { code: "ro", name: "Romanian", flag: "🇷🇴" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "bg", name: "Bulgarian", flag: "🇧🇬" },
  { code: "ms", name: "Malay", flag: "🇲🇾" },
  { code: "sk", name: "Slovak", flag: "🇸🇰" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺" },
  { code: "no", name: "Norwegian", flag: "🇳🇴" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "km", name: "Khmer", flag: "🇰🇭" },
  { code: "my", name: "Myanmar", flag: "🇲🇲" },
  { code: "lo", name: "Lao", flag: "🇱🇦" },
  { code: "ne", name: "Nepali", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", flag: "🇱🇰" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "az", name: "Azerbaijani", flag: "🇦🇿" },
  { code: "ka", name: "Georgian", flag: "🇬🇪" },
  { code: "kk", name: "Kazakh", flag: "🇰🇿" },
  { code: "mn", name: "Mongolian", flag: "🇲🇳" },
  { code: "uz", name: "Uzbek", flag: "🇺🇿" },
];

// Target languages (all languages except auto-detect)
const targetLanguages = sourceLanguages.filter(l => l.code !== "auto");
const statusMessages: Record<string, string> = {
  detecting: "Detecting language and speakers...",
  transcribing: "Transcribing audio to text...",
  translating: "Translating to target language...",
  dubbing: "Synthesizing dubbed audio...",
  dubbed: "Dubbing complete!",
  failed: "Dubbing failed"
};
export function VideoDubber({
  isPro
}: VideoDubberProps) {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [dubbingJob, setDubbingJob] = useState<DubbingJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedMinutes, setUsedMinutes] = useState(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [usageHistory, setUsageHistory] = useState<DubbingHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch monthly usage and history
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) {
        setIsLoadingUsage(false);
        return;
      }
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch usage for current month calculation
      const {
        data: usageData,
        error: usageError
      } = await supabase.from('dubbing_usage').select('duration_seconds').eq('user_id', user.id).gte('created_at', startOfMonth.toISOString());
      if (!usageError && usageData) {
        const totalSeconds = usageData.reduce((acc, row) => acc + (row.duration_seconds || 0), 0);
        setUsedMinutes(Math.ceil(totalSeconds / 60));
      }

      // Fetch full history (last 50 items)
      const {
        data: historyData,
        error: historyError
      } = await supabase.from('dubbing_usage').select('id, dubbing_id, duration_seconds, target_language, file_name, created_at').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(50);
      if (!historyError && historyData) {
        setUsageHistory(historyData);
      }
      setIsLoadingUsage(false);
    };
    fetchUsage();
  }, [user]);
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      // Check file size (max 100MB for dubbing)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setDubbingJob(null);
      setProgress(0);
      setStatus("");
    }
  };
  const checkDubbingStatus = async (dubbingId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-dubbing?action=status&dubbing_id=${dubbingId}`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check status");
      }

      const statusData = await response.json();
      console.log("Dubbing status:", statusData);

      setDubbingJob(prev => ({
        ...prev!,
        status: statusData.status,
        target_languages: statusData.target_languages || prev?.target_languages || []
      }));

      // Update progress based on status
      const statusProgress: Record<string, number> = {
        detecting: 20,
        transcribing: 40,
        translating: 60,
        dubbing: 80,
        dubbed: 100
      };
      setProgress(statusProgress[statusData.status] || 50);
      setStatus(statusMessages[statusData.status] || `Status: ${statusData.status}`);

      // Stop polling when complete or failed
      if (statusData.status === "dubbed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsProcessing(false);
        toast.success("Dubbing complete! You can now download the dubbed audio.");
      } else if (statusData.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsProcessing(false);
        setError(statusData.error || "Dubbing failed");
        toast.error("Dubbing failed. Please try again.");
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const handleProcess = async () => {
    if (!file || !user) return;

    // Check monthly limit
    const remainingMinutes = MONTHLY_LIMIT_MINUTES - usedMinutes;
    if (remainingMinutes <= 0) {
      toast.error("Monthly limit reached. Upgrade to get more minutes!");
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    setStatus("Uploading video...");
    setError(null);
    setDubbingJob(null);
    
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("source_lang", sourceLang);
      formData.append("target_lang", targetLang);
      formData.append("name", `Dubbing: ${file.name}`);

      setProgress(15);
      setStatus("Processing with ElevenLabs AI...");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-dubbing`, {
        method: "POST",
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const result = await response.json();
      console.log("Dubbing started:", result);

      setDubbingJob({
        dubbing_id: result.dubbing_id,
        status: result.status || "dubbing",
        target_languages: [targetLang],
        expected_duration_sec: result.expected_duration_sec || 60
      });

      // Record usage
      const { error: usageError } = await supabase.from('dubbing_usage').insert({
        user_id: user.id,
        dubbing_id: result.dubbing_id,
        duration_seconds: result.expected_duration_sec || 60,
        target_language: targetLang,
        file_name: file?.name || ''
      });

      if (!usageError) {
        setUsedMinutes(prev => prev + Math.ceil((result.expected_duration_sec || 60) / 60));
      }

      // Start polling for status
      setProgress(20);
      setStatus("Dubbing in progress...");
      
      pollIntervalRef.current = setInterval(() => {
        checkDubbingStatus(result.dubbing_id);
      }, 5000);

      // Initial status check
      setTimeout(() => checkDubbingStatus(result.dubbing_id), 2000);

      toast.success("Dubbing started! This may take a few minutes.");
    } catch (err) {
      console.error("Dubbing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process video");
      setIsProcessing(false);
      toast.error(err instanceof Error ? err.message : "Failed to process video");
    }
  };

  const handleDownload = async () => {
    if (!dubbingJob?.dubbing_id) return;
    
    try {
      toast.info("Downloading dubbed audio...");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-dubbing?action=download&dubbing_id=${dubbingJob.dubbing_id}&language_code=${targetLang}`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download dubbed audio");
      }

      const data = await response.json();
      
      // Convert base64 to blob and download
      const audioUrl = `data:audio/mpeg;base64,${data.audio}`;
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `dubbed_${targetLang}_${file?.name || 'audio'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dubbed audio downloaded!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to download audio");
    }
  };
  const handleReset = () => {
    setFile(null);
    setDubbingJob(null);
    setProgress(0);
    setStatus("");
    setError(null);
    setIsProcessing(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };
  const sourceLangData = sourceLanguages.find(l => l.code === sourceLang)!;
  const targetLangData = targetLanguages.find(l => l.code === targetLang)!;
  const remainingMinutes = Math.max(0, MONTHLY_LIMIT_MINUTES - usedMinutes);
  const usagePercentage = usedMinutes / MONTHLY_LIMIT_MINUTES * 100;
  return <div className="p-8 lg:p-12 max-w-5xl mx-auto h-full flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Neural Dubbing Studio</h2>
          <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] mt-2">POWERED BY BATH AI</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Usage Indicator */}
          <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Monthly Usage
              </span>
              {isLoadingUsage ? <span className="text-xs font-bold text-muted-foreground">Loading...</span> : remainingMinutes <= 0 ? <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-destructive">Limit reached</span>
                </div> : <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-black", remainingMinutes <= 5 ? "text-destructive" : remainingMinutes <= 10 ? "text-yellow-500" : "text-primary")}>
                    {remainingMinutes} min left
                  </span>
                  <span className="text-[10px] text-muted-foreground">/ {MONTHLY_LIMIT_MINUTES} min</span>
                </div>}
            </div>
            {remainingMinutes <= 0 && <Button size="sm" onClick={() => navigate('/pricing')} className="ml-2 bg-gradient-to-r from-primary to-primary/80">
                <Zap className="w-3 h-3 mr-1" />
                Upgrade
              </Button>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">CONNECTED</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column - Upload */}
        <div className="lg:col-span-5 flex flex-col">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Globe2 className="w-3 h-3" /> Source Input
          </label>
          
          {/* Language Selector */}
          <div className="relative mb-4">
            <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={isProcessing} className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              {sourceLanguages.map(lang => <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Upload Zone */}
          <div className="relative flex-1 min-h-[300px]">
            <input type="file" accept="video/*,audio/*" onChange={handleFileSelect} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
            <div className={cn("h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all", file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50", isProcessing && "opacity-50")}>
              {file ? <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Film className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  {!isProcessing && <button onClick={e => {
                e.stopPropagation();
                handleReset();
              }} className="mt-4 text-destructive text-[10px] font-black uppercase tracking-widest">
                      Clear
                    </button>}
                </div> : <>
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-bold text-foreground">Drop video or audio file</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-1">MP4, MOV, MP3, WAV (max 100MB)</p>
                </>}
            </div>
          </div>
        </div>

        {/* Center - Arrow */}
        <div className="lg:col-span-2 flex items-center justify-center">
          <div className={cn("w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center transition-all", isProcessing && "animate-pulse bg-primary/10 border-primary/30")}>
            {isProcessing ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ArrowRight className="w-6 h-6 text-muted-foreground" />}
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-5 flex flex-col">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Globe2 className="w-3 h-3" /> Target Output
          </label>
          
          {/* Target Language Selector */}
          <div className="relative mb-4">
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={isProcessing} className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Output Preview */}
          <div className="flex-1 min-h-[300px] rounded-3xl bg-secondary border border-border flex flex-col items-center justify-center p-8">
            {error ? <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-sm font-bold text-destructive">{error}</p>
                <Button className="mt-4" size="sm" variant="outline" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div> : isProcessing ? <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{status}</span>
                  <span className="text-[10px] font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-center text-muted-foreground">
                  This may take several minutes depending on video length
                </p>
              </div> : dubbingJob?.status === "dubbed" ? <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 mx-auto">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-bold text-foreground">Dubbing Complete!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sourceLangData.flag} {sourceLangData.name} → {targetLangData.flag} {targetLangData.name}
                </p>
                <div className="flex gap-2 mt-4 justify-center">
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Audio
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div> : <>
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output Preview</p>
              </>}
          </div>
        </div>
      </div>

      {/* Limit Warning Banner */}
      {!isLoadingUsage && remainingMinutes <= 0 && <div className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-bold text-foreground">Monthly Limit Reached</p>
              <p className="text-xs text-muted-foreground">Upgrade your plan to continue using Neural Dubbing</p>
            </div>
          </div>
          <Button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-primary to-primary/80">
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>}

      {/* Action Button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {remainingMinutes <= 0 ? <Button size="lg" onClick={() => navigate('/pricing')} className="px-12 bg-gradient-to-r from-primary to-primary/80">
            <Zap className="w-4 h-4 mr-2" />
            Upgrade to Continue
          </Button> : <Button size="lg" onClick={handleProcess} disabled={!file || isProcessing || dubbingJob?.status === "dubbed"} className="px-12">
            {isProcessing ? <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </> : <>
                Start Neural Dubbing
                <ArrowRight className="w-4 h-4" />
              </>}
          </Button>}
        {remainingMinutes > 0 && remainingMinutes <= 5 && !isLoadingUsage && <p className="text-xs text-yellow-600 font-medium">
            ⚠️ You have only {remainingMinutes} minutes remaining this month
          </p>}
      </div>

      {/* Usage History Section */}
      <div className="mt-10 border-t border-border pt-8">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <History className="w-4 h-4" />
          <span>Usage History</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showHistory && "rotate-180")} />
        </button>
        
        {showHistory && <div className="mt-4 space-y-2">
            {usageHistory.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No dubbing history yet</p> : <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3">File</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3">Language</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3">Duration</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map(item => {
                const langData = targetLanguages.find(l => l.code === item.target_language);
                return <tr key={item.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px] block">
                              {item.file_name || 'Unknown file'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {langData ? `${langData.flag} ${langData.name}` : item.target_language}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-primary">
                              {Math.ceil(item.duration_seconds / 60)} min
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </td>
                        </tr>;
              })}
                  </tbody>
                </table>
              </div>}
          </div>}
      </div>
    </div>;
}