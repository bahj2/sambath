import { cn } from "@/lib/utils";
import { 
  Mic, Eye, Sparkles, Video, Image, FileText, Plug, Settings, Crown,
  Zap
} from "lucide-react";

interface PlaceholderViewProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  mic: <Mic className="w-8 h-8" />,
  eye: <Eye className="w-8 h-8" />,
  sparkles: <Sparkles className="w-8 h-8" />,
  video: <Video className="w-8 h-8" />,
  image: <Image className="w-8 h-8" />,
  file: <FileText className="w-8 h-8" />,
  plug: <Plug className="w-8 h-8" />,
  settings: <Settings className="w-8 h-8" />,
  crown: <Crown className="w-8 h-8" />,
};

export function PlaceholderView({ title, subtitle, icon = "sparkles" }: PlaceholderViewProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md animate-scale-in">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-glow-md">
          {iconMap[icon] || iconMap.sparkles}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">{subtitle || "Coming Soon"}</p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Coming Soon</span>
        </div>

        {/* Features Preview */}
        <div className="mt-10 grid grid-cols-2 gap-3 text-left">
          {[
            "Advanced AI Models",
            "Real-time Processing",
            "Multiple Formats",
            "API Integration"
          ].map((feature, index) => (
            <div 
              key={feature}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}