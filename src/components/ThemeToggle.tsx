import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center h-10 rounded-full transition-all duration-300 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDark 
          ? "bg-foreground text-background w-[140px]" 
          : "bg-muted text-foreground w-[140px]"
      )}
      aria-label="Toggle theme"
    >
      {/* Light mode state */}
      <div
        className={cn(
          "absolute left-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-100"
        )}
      >
        <span>DAYMODE</span>
      </div>
      
      {/* Dark mode state */}
      <div
        className={cn(
          "absolute right-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-opacity duration-300",
          isDark ? "opacity-100" : "opacity-0"
        )}
      >
        <span>NIGHTMODE</span>
      </div>

      {/* Sliding circle with icon */}
      <div
        className={cn(
          "absolute flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 shadow-sm",
          isDark 
            ? "left-1 bg-background text-foreground" 
            : "right-1 left-auto bg-background text-foreground"
        )}
        style={{
          transform: isDark ? "translateX(0)" : "translateX(0)",
          left: isDark ? "4px" : "auto",
          right: isDark ? "auto" : "4px",
        }}
      >
        {isDark ? (
          <div className="relative">
            <Moon className="h-4 w-4" />
            <Sparkles className="absolute -top-1 -right-1 h-2 w-2" />
          </div>
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </div>
    </button>
  );
}
