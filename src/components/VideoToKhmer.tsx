import { useState, useRef, useEffect } from "react";
import { Upload, Play, Download, Loader2, Video, Globe, Sparkles, X, Volume2, Pause, Clock, RefreshCw, Trash2, Timer, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VideoToKhmerProps {
  isPro: boolean;
}

interface QueueItem {
  id: string;
  file_name: string;
  status: "pending" | "processing" | "completed" | "failed";
  khmer_translation: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

type ErrorType = "rate_limit" | "api_key" | "general" | null;

// Calculate time until next 5-minute interval
const getNextCronTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextRun = Math.ceil((minutes + 1) / 5) * 5;
  const next = new Date(now);
  next.setMinutes(nextRun, 0, 0);
  if (next <= now) {
    next.setMinutes(next.getMinutes() + 5);
  }
  return next;
};
const formatTimeRemaining = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
export function VideoToKhmer({
  isPro
}: VideoToKhmerProps) {
  const {
    user
  } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [khmerSubtitles, setKhmerSubtitles] = useState<string | null>(null);
  const [khmerAudioUrl, setKhmerAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [nextCronTime, setNextCronTime] = useState(getNextCronTime());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [errorState, setErrorState] = useState<{ type: ErrorType; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer for next cron run
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const remaining = nextCronTime.getTime() - now.getTime();
      if (remaining <= 0) {
        setNextCronTime(getNextCronTime());
        setTimeRemaining("Processing...");
        // Brief "processing" state
        setTimeout(() => {
          setTimeRemaining(formatTimeRemaining(getNextCronTime().getTime() - Date.now()));
        }, 2000);
      } else {
        setTimeRemaining(formatTimeRemaining(remaining));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextCronTime]);

  // Fetch queue items
  const fetchQueueItems = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("video_queue").select("*").eq("user_id", user.id).order("created_at", {
      ascending: false
    }).limit(10);
    if (!error && data) {
      setQueueItems(data as QueueItem[]);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    fetchQueueItems();
    const channel = supabase.channel("video_queue_changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "video_queue",
      filter: `user_id=eq.${user.id}`
    }, payload => {
      console.log("Queue update:", payload);
      fetchQueueItems();

      // If a video completed, show notification
      if (payload.eventType === "UPDATE" && (payload.new as QueueItem).status === "completed") {
        toast.success(`Video "${(payload.new as QueueItem).file_name}" translated successfully!`);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video must be less than 100MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setKhmerSubtitles(null);
      setKhmerAudioUrl(null);
    }
  };
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video must be less than 100MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setKhmerSubtitles(null);
      setKhmerAudioUrl(null);
    }
  };
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  const addToQueue = async () => {
    if (!videoFile || !user) {
      toast.error("Please select a video and ensure you're logged in");
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    try {
      const reader = new FileReader();
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });
      setProgress(50);
      const {
        error
      } = await supabase.from("video_queue").insert({
        user_id: user.id,
        file_name: videoFile.name,
        video_data: videoBase64.split(",")[1],
        status: "pending"
      });
      if (error) throw error;
      setProgress(100);
      toast.success("Video added to queue! It will be processed automatically.");
      setShowQueue(true);
      clearVideo();
      fetchQueueItems();
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add to queue");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
  const processVideo = async () => {
    if (!videoFile) {
      toast.error("Please select a video first");
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setErrorState(null);
    
    try {
      const reader = new FileReader();
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });
      setProgress(20);
      
      const { data, error } = await supabase.functions.invoke("video-to-khmer", {
        body: {
          videoBase64: videoBase64.split(",")[1],
          fileName: videoFile.name
        }
      });
      
      setProgress(60);
      
      if (error) {
        const errorMsg = error.message || "Failed to process video";
        
        if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate limit")) {
          setErrorState({
            type: "rate_limit",
            message: "Google AI service is currently busy. Your video will be added to the queue for automatic processing."
          });
          toast.info("Service busy. Adding to queue...");
          await addToQueue();
          return;
        }
        
        if (errorMsg.toLowerCase().includes("api key") || errorMsg.includes("not configured")) {
          setErrorState({
            type: "api_key",
            message: "Google AI Studio API key is not configured. Please contact the administrator."
          });
          throw new Error(errorMsg);
        }
        
        throw new Error(errorMsg);
      }
      
      if (data?.error) {
        const errorMsg = data.error;
        
        if (errorMsg.toLowerCase().includes("rate limit")) {
          setErrorState({
            type: "rate_limit",
            message: "Google AI service is currently busy. Your video will be added to the queue for automatic processing."
          });
          toast.info("Service busy. Adding to queue...");
          await addToQueue();
          return;
        }
        
        if (errorMsg.toLowerCase().includes("api key") || errorMsg.includes("not configured")) {
          setErrorState({
            type: "api_key",
            message: "Google AI Studio API key is not configured. Please contact the administrator."
          });
          throw new Error(errorMsg);
        }
        
        setErrorState({
          type: "general",
          message: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      setProgress(80);
      setKhmerSubtitles(data.khmerTranslation);
      if (data.provider) {
        console.log("Translation provided by:", data.provider);
      }
      setProgress(100);
      setErrorState(null);
      toast.success("Video translated to Khmer successfully!");
    } catch (error) {
      console.error("Error processing video:", error);
      const message = error instanceof Error ? error.message : "Failed to process video";
      
      if (!errorState) {
        setErrorState({
          type: "general",
          message
        });
      }
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };
  const deleteQueueItem = async (id: string) => {
    const {
      error
    } = await supabase.from("video_queue").delete().eq("id", id);
    if (!error) {
      fetchQueueItems();
      toast.success("Removed from queue");
    }
  };
  const loadFromQueue = (item: QueueItem) => {
    if (item.khmer_translation) {
      setKhmerSubtitles(item.khmer_translation);
      toast.success("Loaded translation from queue");
    }
  };
  const triggerQueueProcessing = async () => {
    try {
      await supabase.functions.invoke("process-video-queue");
      toast.success("Queue processing triggered");
    } catch (error) {
      console.error("Error triggering queue:", error);
    }
  };
  const generateKhmerAudio = async () => {
    if (!khmerSubtitles) {
      toast.error("No Khmer text to synthesize");
      return;
    }
    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          text: khmerSubtitles,
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          speed: 0.9,
          stability: 0.6,
          similarityBoost: 0.8
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setKhmerAudioUrl(audioUrl);
      toast.success("Khmer audio generated successfully!");
    } catch (error) {
      console.error("Error generating audio:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  const playKhmerAudio = () => {
    if (!khmerAudioUrl) return;
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } else {
      const audio = new Audio(khmerAudioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    }
  };
  const downloadAudio = () => {
    if (khmerAudioUrl) {
      const a = document.createElement("a");
      a.href = khmerAudioUrl;
      a.download = `${videoFile?.name.replace(/\.[^/.]+$/, "") || "video"}_khmer_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Khmer audio downloaded!");
    }
  };
  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setKhmerSubtitles(null);
    setKhmerAudioUrl(null);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const downloadSubtitles = () => {
    if (khmerSubtitles) {
      const blob = new Blob([khmerSubtitles], {
        type: "text/plain;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoFile?.name.replace(/\.[^/.]+$/, "") || "video"}_khmer.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Khmer subtitles downloaded!");
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-amber-600 bg-amber-50";
    }
  };
  const pendingCount = queueItems.filter(i => i.status === "pending" || i.status === "processing").length;
  return <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50/50 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Video to Khmer</h1>
                <p className="text-sm text-slate-500">AI-powered translation & dubbing to Khmer</p>
              </div>
            </div>
            {pendingCount > 0 && <Button variant="outline" size="sm" onClick={() => setShowQueue(!showQueue)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <Clock className="w-4 h-4 mr-2" />
                {pendingCount} in Queue
              </Button>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">Translation<Sparkles className="w-3 h-3" />
              Google AI Translation
            </span>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full flex items-center gap-1"> Voice<Volume2 className="w-3 h-3" />
              ElevenLabs Voice
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Auto Queue
            </span>
          </div>
        </div>

        {/* Queue Panel */}
        {showQueue && queueItems.length > 0 && <Card className="border-amber-200 shadow-sm mb-6 animate-slide-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Processing Queue
                </CardTitle>
                <div className="flex items-center gap-3">
                  {/* Next run countdown */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                    <Timer className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      Next auto-run: <span className="font-mono">{timeRemaining}</span>
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={triggerQueueProcessing}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Process Now
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queueItems.map(item => <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{item.file_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "completed" && <Button variant="ghost" size="sm" onClick={() => loadFromQueue(item)}>
                          Load
                        </Button>}
                      <Button variant="ghost" size="icon" onClick={() => deleteQueueItem(item.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

        {/* Error Alert */}
        {errorState && (
          <Alert 
            variant={errorState.type === "rate_limit" ? "default" : "destructive"} 
            className={`mb-6 animate-slide-up ${
              errorState.type === "rate_limit" 
                ? "border-amber-200 bg-amber-50 text-amber-900" 
                : errorState.type === "api_key"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-destructive/50 bg-destructive/10"
            }`}
          >
            <AlertCircle className={`h-4 w-4 ${
              errorState.type === "rate_limit" 
                ? "text-amber-600" 
                : "text-destructive"
            }`} />
            <AlertTitle className="font-semibold">
              {errorState.type === "rate_limit" && "Rate Limit Reached"}
              {errorState.type === "api_key" && "Configuration Error"}
              {errorState.type === "general" && "Translation Error"}
            </AlertTitle>
            <AlertDescription className="mt-1">
              <p>{errorState.message}</p>
              {errorState.type === "rate_limit" && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Queued videos will be processed automatically every 5 minutes. 
                    Next run in: <span className="font-mono font-medium">{timeRemaining}</span>
                  </span>
                </div>
              )}
              {errorState.type === "rate_limit" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-amber-300 hover:bg-amber-100"
                  onClick={() => {
                    setShowQueue(true);
                    setErrorState(null);
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Queue
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-slate-200/80 shadow-sm animate-slide-up" style={{
          animationDelay: "50ms"
        }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-slate-600" />
                Upload Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!videoPreview ? <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">Drop your video here</p>
                  <p className="text-xs text-slate-400">or click to browse (MP4, WebM, MOV up to 100MB)</p>
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                </div> : <div className="relative">
                  <video src={videoPreview} className="w-full rounded-xl" controls />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white" onClick={clearVideo}>
                    <X className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 truncate">{videoFile?.name}</p>
                </div>}

              {isProcessing && <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Processing...</span>
                    <span className="text-emerald-600 font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>}

              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={processVideo} disabled={!videoFile || isProcessing}>
                  {isProcessing ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </> : <>
                      <Play className="w-4 h-4 mr-2" />
                      Translate Now
                    </>}
                </Button>
                <Button variant="outline" onClick={addToQueue} disabled={!videoFile || isProcessing || !user} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Clock className="w-4 h-4 mr-1" />
                  Queue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="border-slate-200/80 shadow-sm animate-slide-up" style={{
          animationDelay: "100ms"
        }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Khmer Translation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {khmerSubtitles ? <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-slate-700 whitespace-pre-wrap font-khmer text-lg leading-relaxed">
                      {khmerSubtitles}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Volume2 className="w-4 h-4 text-violet-600" />
                      <span className="text-sm font-semibold text-violet-700">Khmer Voice Dubbing</span>
                    </div>
                    
                    {!khmerAudioUrl ? <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700" onClick={generateKhmerAudio} disabled={isGeneratingAudio}>
                        {isGeneratingAudio ? <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Audio...
                          </> : <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Khmer Audio
                          </>}
                      </Button> : <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-50" onClick={playKhmerAudio}>
                          {isPlayingAudio ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Play Audio</>}
                        </Button>
                        <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50" onClick={downloadAudio}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>}
                  </div>

                  <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={downloadSubtitles}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Khmer Text
                  </Button>
                </div> : <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
                  <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">
                    Khmer translation will appear here after processing
                  </p>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[{
          title: "Auto Queue",
          desc: "Rate limit? Auto-retry later"
        }, {
          title: "AI Translation",
          desc: "Accurate Khmer translation"
        }, {
          title: "Voice Synthesis",
          desc: "Natural Khmer audio"
        }, {
          title: "Real-time Updates",
          desc: "Live queue status"
        }].map((feature, index) => <div key={feature.title} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm animate-slide-up" style={{
          animationDelay: `${150 + index * 50}ms`
        }}>
              <h3 className="font-semibold text-slate-700 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </div>)}
        </div>
      </div>
    </div>;
}