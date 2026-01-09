import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, Mic, FileAudio, Loader2, Play, Pause, Download, 
  Trash2, Copy, Check, Users, Clock, Volume2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpeechToTextProps {
  isPro: boolean;
}

interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

interface TranscriptionResult {
  text: string;
  words?: TranscriptionWord[];
  language_code?: string;
  language_probability?: number;
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "nl", name: "Dutch" },
  { code: "cs", name: "Czech" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi" },
  { code: "ko", name: "Korean" },
  { code: "vi", name: "Vietnamese" },
  { code: "km", name: "Khmer" },
];

export function SpeechToText({ isPro }: SpeechToTextProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast.error("Please upload a valid audio file (MP3, WAV, M4A, WebM, OGG)");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB");
      return;
    }

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setTranscription(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    setIsTranscribing(true);
    setTranscription(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language", selectedLanguage);

      // Use the new Google AI STT function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-stt`,
        {
          method: "POST",
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTranscription(data);
      toast.success("Transcription completed!");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCopy = async () => {
    if (transcription?.text) {
      await navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (transcription?.text) {
      const blob = new Blob([transcription.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setTranscription(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupBySpeaker = (words: TranscriptionWord[]) => {
    if (!words || words.length === 0) return [];
    
    const segments: { speaker: string; text: string; start: number; end: number }[] = [];
    let currentSegment = {
      speaker: words[0].speaker || 'Speaker 1',
      text: words[0].text,
      start: words[0].start,
      end: words[0].end
    };

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      if (word.speaker === currentSegment.speaker || !word.speaker) {
        currentSegment.text += ' ' + word.text;
        currentSegment.end = word.end;
      } else {
        segments.push(currentSegment);
        currentSegment = {
          speaker: word.speaker,
          text: word.text,
          start: word.start,
          end: word.end
        };
      }
    }
    segments.push(currentSegment);
    
    return segments;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileAudio className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Speech to Text</h1>
            <p className="text-sm text-muted-foreground">
              Transcribe audio files with Google AI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload & Controls */}
        <div className="space-y-6">
          {/* Upload Area */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50",
                  audioFile && "border-primary/30 bg-primary/5"
                )}
              >
                {audioFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <FileAudio className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-xs mx-auto">
                        {audioFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    
                    {audioUrl && (
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={togglePlay}
                          className="rounded-full"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClear}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Drop your audio file here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        MP3, WAV, M4A, WebM, OGG up to 25MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Transcription Settings
              </h3>
              
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Audio Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Speaker detection enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Powered by Google AI</span>
                </div>
              </div>

              <Button
                onClick={handleTranscribe}
                disabled={!audioFile || isTranscribing}
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Transcribe Audio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <Card className="bg-card border-border h-fit">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Transcription Result</h3>
              {transcription && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isTranscribing ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Mic className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Processing with Google AI...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              </div>
            ) : transcription ? (
              <div className="space-y-4">
                {/* Full Text */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {transcription.text}
                  </p>
                </div>

                {/* Speaker Segments */}
                {transcription.words && transcription.words.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Speaker Timeline
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {groupBySpeaker(transcription.words).map((segment, index) => (
                        <div 
                          key={index}
                          className="bg-secondary/20 rounded-lg p-3 border-l-2 border-primary/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-primary">
                              {segment.speaker}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(segment.start)} - {formatTime(segment.end)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language Detection */}
                {transcription.language_code && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Language</span>
                    <span className="text-foreground font-medium">
                      {languages.find(l => l.code === transcription.language_code)?.name || transcription.language_code}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <FileAudio className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Upload an audio file and click transcribe to see the results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
