import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mic, Square, ArrowRight, Volume2, Loader2, Languages, RefreshCw, Download, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SpeechToSpeechProps {
  isPro: boolean;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "km", name: "Khmer", flag: "🇰🇭" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
];

const voices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Female" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "Male" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "Female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "Male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "Male" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "Female" },
];

export function SpeechToSpeech({ isPro }: SpeechToSpeechProps) {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started - speak now");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscribedText("");
    setTranslatedText("");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("voiceId", selectedVoice);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speech-to-speech`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Translation failed");
      }

      const result = await response.json();

      setTranscribedText(result.transcribedText);
      setTranslatedText(result.translatedText);

      // Create audio URL from base64
      const audioBlob64 = base64ToBlob(result.audioBase64, "audio/mpeg");
      const url = URL.createObjectURL(audioBlob64);
      setAudioUrl(url);

      toast.success("Translation complete!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `translated_speech_${targetLanguage}.mp3`;
      link.click();
      toast.success("Audio downloaded!");
    }
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setTranscribedText("");
    setTranslatedText("");
    setAudioUrl(null);
  };

  const resetAll = () => {
    setTranscribedText("");
    setTranslatedText("");
    setAudioUrl(null);
    setIsPlaying(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Speech-to-Speech Translation
        </h1>
        <p className="text-slate-500">
          Record your voice and translate it to another language instantly
        </p>
      </div>

      {/* Language Selection */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Source Language
              </label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={swapLanguages}
              className="mt-6"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Target Language
              </label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Output Voice
            </label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recording Section */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className={`relative ${isRecording ? "animate-pulse" : ""}`}>
              <Button
                size="lg"
                className={`w-24 h-24 rounded-full ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </Button>
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {isRecording
                ? "Recording... Click to stop"
                : isProcessing
                ? "Processing your speech..."
                : "Click to start recording"}
            </p>
            {isProcessing && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Transcribing, translating, and generating speech...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(transcribedText || translatedText) && (
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Source Text */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-slate-500" />
                  <h3 className="font-medium text-slate-700">
                    Original ({languages.find(l => l.code === sourceLanguage)?.name})
                  </h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg min-h-[100px]">
                  <p className="text-slate-700">{transcribedText}</p>
                </div>
              </div>

              {/* Target Text */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <h3 className="font-medium text-slate-700">
                    Translated ({languages.find(l => l.code === targetLanguage)?.name})
                  </h3>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg min-h-[100px]">
                  <p className="text-slate-700">{translatedText}</p>
                </div>
              </div>
            </div>

            {/* Audio Playback */}
            {audioUrl && (
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playAudio}
                      className="bg-white"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Translated Audio
                      </p>
                      <p className="text-xs text-slate-500">
                        Voice: {voices.find(v => v.id === selectedVoice)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadAudio}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetAll}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
