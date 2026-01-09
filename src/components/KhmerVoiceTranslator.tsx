import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mic, Square, Download, Pause, Play, ArrowRight, Loader2, ArrowLeftRight, MessageCircle, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KhmerVoiceTranslatorProps {
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
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
];

const voices = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Female" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "Male" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "Female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "Male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "Male" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "Female" },
];

type TranslationMode = "khmer-to-other" | "other-to-khmer";

interface ConversationMessage {
  id: string;
  speaker: "khmer" | "other";
  sourceText: string;
  translatedText: string;
  audioUrl: string | null;
  timestamp: Date;
}

export function KhmerVoiceTranslator({ isPro }: KhmerVoiceTranslatorProps) {
  const [activeTab, setActiveTab] = useState<"translate" | "conversation">("translate");
  const [mode, setMode] = useState<TranslationMode>("khmer-to-other");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Conversation mode state
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<"khmer" | "other">("khmer");
  const [autoPlay, setAutoPlay] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isKhmerToOther = mode === "khmer-to-other";
  const currentLang = languages.find(l => l.code === selectedLanguage);

  const toggleMode = () => {
    setMode(isKhmerToOther ? "other-to-khmer" : "khmer-to-other");
    setSourceText("");
    setTranslatedText("");
    setAudioUrl(null);
  };

  const toggleSpeaker = () => {
    setCurrentSpeaker(prev => prev === "khmer" ? "other" : "khmer");
  };

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
        if (activeTab === "conversation") {
          await processConversationAudio(audioBlob);
        } else {
          await processAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      if (activeTab === "conversation") {
        const speakerLang = currentSpeaker === "khmer" ? "Khmer" : currentLang?.name;
        toast.info(`Recording - speak in ${speakerLang}`);
      } else if (isKhmerToOther) {
        toast.info("ថតសំឡេង - សូមនិយាយខ្មែរ", { description: "Recording - speak in Khmer" });
      } else {
        toast.info(`Recording - speak in ${currentLang?.name || selectedLanguage}`);
      }
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
    setSourceText("");
    setTranslatedText("");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("mode", mode);
      formData.append("sourceLanguage", selectedLanguage);
      formData.append("targetLanguage", selectedLanguage);
      formData.append("voiceId", selectedVoice);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/khmer-voice-translate`,
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

      setSourceText(result.sourceText);
      setTranslatedText(result.translatedText);

      const audioBlob64 = base64ToBlob(result.audioBase64, "audio/mpeg");
      const url = URL.createObjectURL(audioBlob64);
      setAudioUrl(url);

      toast.success("ការបកប្រែបានជោគជ័យ!", { description: "Translation complete!" });
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const processConversationAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const isKhmerSpeaker = currentSpeaker === "khmer";
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("mode", isKhmerSpeaker ? "khmer-to-other" : "other-to-khmer");
      formData.append("sourceLanguage", selectedLanguage);
      formData.append("targetLanguage", selectedLanguage);
      formData.append("voiceId", selectedVoice);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/khmer-voice-translate`,
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

      const audioBlob64 = base64ToBlob(result.audioBase64, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob64);

      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        speaker: currentSpeaker,
        sourceText: result.sourceText,
        translatedText: result.translatedText,
        audioUrl,
        timestamp: new Date(),
      };

      setConversationMessages(prev => [...prev, newMessage]);

      // Auto-play the translation
      if (autoPlay && conversationAudioRef.current) {
        conversationAudioRef.current.src = audioUrl;
        conversationAudioRef.current.play();
      }

      // Auto-switch speaker for next turn
      setCurrentSpeaker(prev => prev === "khmer" ? "other" : "khmer");

      toast.success("Translation added to conversation");
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

  const playConversationAudio = (url: string) => {
    if (conversationAudioRef.current) {
      conversationAudioRef.current.src = url;
      conversationAudioRef.current.play();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      const fileName = isKhmerToOther 
        ? `khmer_to_${selectedLanguage}.mp3`
        : `${selectedLanguage}_to_khmer.mp3`;
      link.download = fileName;
      link.click();
      toast.success("Audio downloaded!");
    }
  };

  const resetAll = () => {
    setSourceText("");
    setTranslatedText("");
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const clearConversation = () => {
    setConversationMessages([]);
    setCurrentSpeaker("khmer");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🇰🇭</span>
          <h1 className="text-2xl font-bold text-slate-800">
            Khmer Voice Translator
          </h1>
        </div>
        <p className="text-slate-500">
          Bidirectional voice translation between Khmer and other languages
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "translate" | "conversation")} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="translate" className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Translate
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Conversation
          </TabsTrigger>
        </TabsList>

        {/* TRANSLATE TAB */}
        <TabsContent value="translate" className="space-y-6">
          {/* Mode Toggle */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <button
                  onClick={() => setMode("khmer-to-other")}
                  className={`flex-1 p-4 text-center transition-all ${
                    isKhmerToOther 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🇰🇭</span>
                    <span className="font-medium">Khmer</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Other</span>
                  </div>
                </button>
                
                <button
                  onClick={toggleMode}
                  className="px-4 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center"
                >
                  <ArrowLeftRight className="w-5 h-5 text-slate-500" />
                </button>
                
                <button
                  onClick={() => setMode("other-to-khmer")}
                  className={`flex-1 p-4 text-center transition-all ${
                    !isKhmerToOther 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium">Other</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-xl">🇰🇭</span>
                    <span className="font-medium">Khmer</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">
                    {isKhmerToOther ? "Translate to" : "Speak in"}
                  </label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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

                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">
                    Output Voice
                  </label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* Recording Section */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  {isKhmerToOther ? (
                    <>
                      <p className="text-lg font-medium text-slate-700">🇰🇭 និយាយជាភាសាខ្មែរ</p>
                      <p className="text-sm text-slate-500">Speak in Khmer</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-slate-700">
                        {currentLang?.flag} Speak in {currentLang?.name}
                      </p>
                      <p className="text-sm text-slate-500">Will be translated to Khmer</p>
                    </>
                  )}
                </div>
                
                <div className={`relative ${isRecording ? "animate-pulse" : ""}`}>
                  <Button
                    size="lg"
                    className={`w-28 h-28 rounded-full text-white shadow-lg ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <Square className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </Button>
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                  )}
                </div>
                
                <p className="mt-4 text-sm text-slate-500">
                  {isRecording ? "Recording... Click to stop" : isProcessing ? "Processing..." : "Click to start recording"}
                </p>
                
                {isProcessing && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Translating with Google AI...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {(sourceText || translatedText) && (
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{isKhmerToOther ? "🇰🇭" : currentLang?.flag}</span>
                      <h3 className="font-medium text-slate-700">
                        {isKhmerToOther ? "ភាសាខ្មែរ (Khmer)" : currentLang?.name}
                      </h3>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg min-h-[100px]">
                      <p className="text-slate-700 text-lg" style={isKhmerToOther ? { fontFamily: "'Noto Sans Khmer', sans-serif" } : {}}>
                        {sourceText}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{isKhmerToOther ? currentLang?.flag : "🇰🇭"}</span>
                      <h3 className="font-medium text-slate-700">
                        {isKhmerToOther ? currentLang?.name : "ភាសាខ្មែរ (Khmer)"}
                      </h3>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg min-h-[100px]">
                      <p className="text-slate-700 text-lg" style={!isKhmerToOther ? { fontFamily: "'Noto Sans Khmer', sans-serif" } : {}}>
                        {translatedText}
                      </p>
                    </div>
                  </div>
                </div>

                {audioUrl && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={playAudio} className="bg-white h-12 w-12">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Listen in {isKhmerToOther ? currentLang?.name : "Khmer"}</p>
                          <p className="text-xs text-slate-500">Voice: {voices.find(v => v.id === selectedVoice)?.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadAudio}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetAll}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONVERSATION TAB */}
        <TabsContent value="conversation" className="space-y-6">
          {/* Conversation Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇰🇭</span>
                    <span className="font-medium">Khmer Speaker</span>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentLang?.flag}</span>
                    <span className="font-medium">{currentLang?.name} Speaker</span>
                  </div>
                </div>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-40">
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
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-700 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Conversation
                </h3>
                {conversationMessages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearConversation}>
                    Clear
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
                {conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Users className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">Start a conversation by recording</p>
                    <p className="text-xs">Messages will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.speaker === "khmer" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            msg.speaker === "khmer"
                              ? "bg-slate-100 rounded-tl-sm"
                              : "bg-blue-100 rounded-tr-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{msg.speaker === "khmer" ? "🇰🇭" : currentLang?.flag}</span>
                            <span className="text-xs font-medium text-slate-500">
                              {msg.speaker === "khmer" ? "Khmer Speaker" : `${currentLang?.name} Speaker`}
                            </span>
                          </div>
                          <p
                            className="text-slate-700 mb-2"
                            style={msg.speaker === "khmer" ? { fontFamily: "'Noto Sans Khmer', sans-serif" } : {}}
                          >
                            {msg.sourceText}
                          </p>
                          <div className="border-t border-slate-200 pt-2 mt-2">
                            <p className="text-xs text-slate-500 mb-1">Translation:</p>
                            <p
                              className="text-slate-600 text-sm"
                              style={msg.speaker !== "khmer" ? { fontFamily: "'Noto Sans Khmer', sans-serif" } : {}}
                            >
                              {msg.translatedText}
                            </p>
                          </div>
                          {msg.audioUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => playConversationAudio(msg.audioUrl!)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Play Translation
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                {/* Current Speaker Indicator */}
                <div className="mb-4 p-3 bg-slate-50 rounded-xl flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${currentSpeaker === "khmer" ? "bg-blue-100 ring-2 ring-blue-500" : "bg-slate-100"}`}>
                    <span className="text-2xl">🇰🇭</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={toggleSpeaker} disabled={isRecording || isProcessing}>
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                  <div className={`p-2 rounded-lg ${currentSpeaker === "other" ? "bg-blue-100 ring-2 ring-blue-500" : "bg-slate-100"}`}>
                    <span className="text-2xl">{currentLang?.flag}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4">
                  {currentSpeaker === "khmer" ? (
                    <>Recording as <strong>Khmer</strong> speaker → translating to <strong>{currentLang?.name}</strong></>
                  ) : (
                    <>Recording as <strong>{currentLang?.name}</strong> speaker → translating to <strong>Khmer</strong></>
                  )}
                </p>
                
                <div className={`relative ${isRecording ? "animate-pulse" : ""}`}>
                  <Button
                    size="lg"
                    className={`w-24 h-24 rounded-full text-white shadow-lg ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : currentSpeaker === "khmer"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500"
                        : "bg-gradient-to-r from-violet-600 to-purple-500"
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </Button>
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                  )}
                </div>
                
                <p className="mt-4 text-sm text-slate-500">
                  {isRecording ? "Recording... Click to stop" : isProcessing ? "Translating..." : "Tap to record"}
                </p>
                
                {isProcessing && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <audio ref={conversationAudioRef} className="hidden" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
