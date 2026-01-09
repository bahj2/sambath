import { Check, ChevronDown, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const sourceLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

const targetLanguages: Language[] = [
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

interface LanguageSelectorProps {
  type: "source" | "target";
  selected: string;
  onSelect: (code: string) => void;
}

export function LanguageSelector({ type, selected, onSelect }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const languages = type === "source" ? sourceLanguages : targetLanguages;
  const selectedLang = languages.find((l) => l.code === selected) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <Globe2 className="w-4 h-4" />
        {type === "source" ? "From" : "To"}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200",
          "bg-background hover:bg-secondary/50 border-border hover:border-primary/50",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedLang.flag}</span>
          <div className="text-left">
            <p className="font-semibold text-foreground">{selectedLang.name}</p>
            <p className="text-xs text-muted-foreground">{selectedLang.nativeName}</p>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 rounded-xl border border-border bg-background shadow-lg animate-fade-in overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all duration-150",
                "hover:bg-secondary",
                selected === lang.code && "bg-primary/5"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
              </div>
              {selected === lang.code && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}