import { AppView } from "@/types";
import { 
  LayoutDashboard, Film, Mic, Video, Languages, Eye, Volume2, 
  UserCircle, Crown, Sparkles, Image, FileText, Plug, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut, FileAudio, Moon, Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import bathAiLogo from "@/assets/bath-ai-logo.png";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isPro: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const mainNavItems = [
  { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: AppView.BUILD, label: 'Build Agent', icon: UserCircle },
];

const toolsNavItems = [
  { id: AppView.VIDEO_TRANSLATOR, label: 'Neural Dubbing', icon: Film },
  { id: AppView.VOICE_CLONE, label: 'Voice Clone', icon: Mic },
  { id: AppView.TRANSLATOR, label: 'Translator', icon: Languages },
  { id: AppView.SPEECH_TO_SPEECH, label: 'Speech to Speech', icon: Languages },
  { id: AppView.KHMER_VOICE, label: 'Khmer Voice', icon: Mic },
  { id: AppView.LIVE_VOICE, label: 'Voice Chat', icon: Volume2 },
  { id: AppView.VIDEO_INSIGHTS, label: 'Visual AI', icon: Eye },
  { id: AppView.SPEECH_SYNTH, label: 'Speech Synth', icon: Sparkles },
  { id: AppView.SPEECH_TO_TEXT, label: 'Speech to Text', icon: FileAudio },
  { id: AppView.VIDEO_GEN, label: 'Video Gen', icon: Video },
  { id: AppView.KLING_VIDEO_GEN, label: 'Kling Video Gen', icon: Video },
  { id: AppView.IMAGE_GEN, label: 'Image Gen', icon: Image },
  { id: AppView.DOCUMENT_AI, label: 'Document AI', icon: FileText },
  { id: AppView.API_HUB, label: 'API Hub', icon: Plug },
];

const bottomNavItems = [
  { id: AppView.ADMIN, label: 'Admin', icon: Shield },
  { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
];

export function AppSidebar({ 
  activeView, 
  onViewChange, 
  isPro,
  isCollapsed: controlledCollapsed,
  onCollapsedChange 
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleCollapsedChange = (collapsed: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    } else {
      setInternalCollapsed(collapsed);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const NavButton = ({ item, showLabel = true }: { item: typeof mainNavItems[0], showLabel?: boolean }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    
    return (
      <button
        onClick={() => onViewChange(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn(
          "w-4 h-4 flex-shrink-0 transition-transform duration-300",
          isActive && "text-primary",
          isCollapsed && "scale-110"
        )} />
        <span className={cn(
          "text-xs font-medium truncate transition-all duration-300 ease-out",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          {showLabel && item.label}
        </span>
      </button>
    );
  };

  return (
    <aside className={cn(
      "bg-background border-r border-border flex flex-col h-screen flex-shrink-0 relative",
      "transition-[width] duration-300 ease-out",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "p-4 border-b border-border flex items-center gap-3 transition-all duration-300",
        isCollapsed && "justify-center px-2"
      )}>
        <img 
          src={bathAiLogo} 
          alt="Bath AI" 
          className={cn(
            "object-contain transition-all duration-300 ease-out",
            isCollapsed ? "w-8 h-8" : "w-9 h-9"
          )} 
        />
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <h1 className="text-base font-bold text-foreground tracking-tight leading-tight whitespace-nowrap">Bath AI</h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">AI Studio</p>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => handleCollapsedChange(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-16 w-6 h-6 bg-background border border-border rounded-full",
          "flex items-center justify-center hover:bg-muted hover:border-primary/50 hover:scale-110",
          "transition-all duration-200 ease-out z-50 shadow-sm"
        )}
      >
        <div className={cn(
          "transition-transform duration-300 ease-out",
          isCollapsed ? "rotate-0" : "rotate-180"
        )}>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar px-2">
        {/* Main */}
        <div className="space-y-1 mb-6">
          <p className={cn(
            "px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2",
            "transition-all duration-300 ease-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
          )}>
            Main
          </p>
          {mainNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        {/* Tools */}
        <div className="space-y-1 mb-6">
          <p className={cn(
            "px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2",
            "transition-all duration-300 ease-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
          )}>
            AI Tools
          </p>
          {toolsNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        {/* Bottom */}
        <div className="space-y-1">
          <p className={cn(
            "px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2",
            "transition-all duration-300 ease-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
          )}>
            System
          </p>
          {bottomNavItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </nav>

      {/* User & Pro Status */}
      <div className={cn(
        "border-t border-border space-y-2 transition-all duration-300 ease-out",
        isCollapsed ? "p-2" : "p-3"
      )}>
        {/* User info */}
        {user && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl bg-muted transition-all duration-300",
            isCollapsed && "justify-center px-2"
          )}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className={cn(
              "flex-1 min-w-0 transition-all duration-300 ease-out overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Pro status */}
        {isPro ? (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 bg-primary/10 rounded-xl transition-all duration-300",
            isCollapsed && "justify-center px-2"
          )}>
            <Crown className={cn(
              "w-4 h-4 text-primary flex-shrink-0 transition-transform duration-300",
              isCollapsed && "scale-110"
            )} />
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block whitespace-nowrap">Pro</span>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">Full Access</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => onViewChange(AppView.BUILD)}
            className={cn(
              "w-full py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold uppercase rounded-xl",
              "hover:shadow-lg hover:shadow-primary/25 transition-all duration-300",
              isCollapsed ? "text-[10px] px-1" : "text-[10px] tracking-wide"
            )}
          >
            {isCollapsed ? <Crown className="w-4 h-4 mx-auto" /> : "Upgrade"}
          </button>
        )}

        {/* Theme toggle */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300",
            isCollapsed && "justify-center px-2"
          )}
        >
          <div className="relative w-4 h-4 flex-shrink-0">
            <Sun className="w-4 h-4 absolute rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="w-4 h-4 absolute rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          </div>
          <span className={cn(
            "text-xs font-medium transition-all duration-300 ease-out whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-2"
          )}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Sign out */}
        <button 
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className={cn(
            "text-xs font-medium transition-all duration-300 ease-out whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
