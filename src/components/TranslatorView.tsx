import { useState } from "react";
import { Languages, ArrowLeftRight, Copy, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TranslatorProps {
  isPro: boolean;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "km", name: "Khmer", flag: "🇰🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
];

export function Translator({ isPro }: TranslatorProps) {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("km");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    // Simulate translation
    setTimeout(() => {
      setTranslatedText(`[Translated to ${languages.find(l => l.code === targetLang)?.name}]: ${sourceText}`);
      setIsTranslating(false);
    }, 1000);
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto h-full flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="mb-10">
        <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Linguistic Command</h2>
        <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
          Enterprise Translation Engine
        </p>
      </header>

      {/* Language Selectors */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleSwapLanguages}
          className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <div className="flex-1">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full appearance-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Source */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Text</span>
            <span className="text-[10px] font-bold text-muted-foreground">{sourceText.length} chars</span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className="flex-1 min-h-[300px] p-6 rounded-2xl bg-secondary border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Target */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Translation</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                disabled={!translatedText}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors" disabled={!translatedText}>
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className={cn(
            "flex-1 min-h-[300px] p-6 rounded-2xl bg-secondary border border-border",
            isTranslating && "animate-pulse"
          )}>
            {translatedText ? (
              <p className="text-foreground">{translatedText}</p>
            ) : (
              <p className="text-muted-foreground">Translation will appear here...</p>
            )}
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <div className="mt-6 flex justify-center">
        <Button 
          size="lg" 
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isTranslating}
          className="px-12"
        >
          <Languages className="w-4 h-4" />
          {isTranslating ? "Translating..." : "Translate"}
        </Button>
      </div>
    </div>
  );
}