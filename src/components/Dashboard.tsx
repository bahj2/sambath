import { AppView } from "@/types";
import { Film, Mic, Languages, Volume2, Eye, Sparkles, Video, ArrowRight, Image, FileText, Plug, Zap, Brain, Globe, Eraser, Clapperboard, ImageOff, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";
interface DashboardProps {
  onNavigate: (view: AppView) => void;
  isPro: boolean;
}
const cards = [{
  title: "Neural Dubbing Studio",
  description: "AI-powered video translation with voice cloning and lip-sync technology.",
  id: AppView.VIDEO_TRANSLATOR,
  iconBg: "bg-primary/10",
  iconColor: "text-primary",
  icon: Film,
  tag: "Popular",
  tagColor: "bg-accent"
}, {
  title: "Bio-Vocal Clone Lab",
  description: "Clone any voice with just 30 seconds of audio for authentic localization.",
  id: AppView.VOICE_CLONE,
  iconBg: "bg-secondary",
  iconColor: "text-primary",
  icon: Mic,
  tag: "New",
  tagColor: "bg-muted-foreground"
}, {
  title: "Linguistic Command",
  description: "Enterprise-grade translation engine supporting 50+ languages.",
  id: AppView.TRANSLATOR,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
  icon: Languages
}, {
  title: "Native Voice Chat",
  description: "Real-time conversational AI with ultra-low latency voice interaction.",
  id: AppView.LIVE_VOICE,
  iconBg: "bg-secondary",
  iconColor: "text-primary",
  icon: Volume2,
  tag: "Live",
  tagColor: "bg-green-500"
}, {
  title: "Visual Intelligence",
  description: "Extract insights, detect objects, and analyze video content with AI.",
  id: AppView.VIDEO_INSIGHTS,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
  icon: Eye
}, {
  title: "Speech Synth Pro",
  description: "Natural text-to-speech with 200+ premium voices across 40 languages.",
  id: AppView.SPEECH_SYNTH,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
  icon: Sparkles
}, {
  title: "Veo Cinematic Lab",
  description: "Generate stunning videos from text prompts or transform images to motion.",
  id: AppView.VIDEO_GEN,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
  icon: Video,
  tag: "Pro",
  tagColor: "bg-primary"
}, {
  title: "Veo 3 Video Gen",
  description: "Next-gen AI video generation with Google's latest Veo 3 technology.",
  id: AppView.VEO3_VIDEO_GEN,
  iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
  iconColor: "text-violet-600 dark:text-violet-400",
  icon: Clapperboard,
  tag: "New",
  tagColor: "bg-violet-500"
}, {
  title: "AI Image Studio",
  description: "Create, edit, and enhance images with state-of-the-art AI models.",
  id: AppView.IMAGE_GEN,
  iconBg: "bg-secondary",
  iconColor: "text-primary",
  icon: Image,
  tag: "New",
  tagColor: "bg-muted-foreground"
}, {
  title: "Document AI",
  description: "Extract data, summarize, and analyze documents with intelligent processing.",
  id: AppView.DOCUMENT_AI,
  iconBg: "bg-primary/10",
  iconColor: "text-primary",
  icon: FileText
}, {
  title: "API Integration Hub",
  description: "Connect to 100+ AI services and automate your workflows seamlessly.",
  id: AppView.API_HUB,
  iconBg: "bg-secondary",
  iconColor: "text-primary",
  icon: Plug,
  tag: "Pro",
  tagColor: "bg-primary"
}, {
  title: "Video to Khmer",
  description: "Translate video content to Khmer language with AI-powered transcription.",
  id: AppView.VIDEO_TO_KHMER,
  iconBg: "bg-green-500/10 dark:bg-green-500/20",
  iconColor: "text-green-600 dark:text-green-400",
  icon: Globe,
  tag: "New",
  tagColor: "bg-green-500"
}, {
  title: "Watermark Remover Video",
  description: "AI-powered removal of watermarks from videos using KIE AI.",
  id: AppView.WATERMARK_REMOVER,
  iconBg: "bg-destructive/10",
  iconColor: "text-destructive",
  icon: Eraser,
  tag: "New",
  tagColor: "bg-destructive"
}, {
  title: "Image Watermark Remover",
  description: "Remove watermarks from images using Google Gemini AI.",
  id: AppView.IMAGE_WATERMARK_REMOVER,
  iconBg: "bg-pink-500/10 dark:bg-pink-500/20",
  iconColor: "text-pink-600 dark:text-pink-400",
  icon: ImageOff,
  tag: "New",
  tagColor: "bg-pink-500"
}, {
  title: "Video Understanding",
  description: "Analyze and understand video content using Google Gemini AI.",
  id: AppView.VIDEO_UNDERSTANDING,
  iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
  iconColor: "text-cyan-600 dark:text-cyan-400",
  icon: MonitorPlay,
  tag: "Free",
  tagColor: "bg-green-500"
}];
const stats = [{
  value: "50+",
  label: "Languages Supported",
  icon: Languages
}, {
  value: "10M+",
  label: "Videos Processed",
  icon: Film
}, {
  value: "99.9%",
  label: "Uptime Guarantee",
  icon: Zap
}, {
  value: "500K+",
  label: "Active Users",
  icon: Brain
}];
export function Dashboard({
  onNavigate,
  isPro
}: DashboardProps) {
  return <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-primary/5 overflow-y-auto custom-scrollbar">
      <div className="relative p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                System Online • V5.0
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight font-serif italic">
              Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent not-italic">Bath AI</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl">
              Your complete AI production suite for video, voice, and content creation.
            </p>
          </div>
          
          {!isPro && <button onClick={() => onNavigate(AppView.BUILD)} className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full font-semibold hover:shadow-primary/25 transition-all animate-scale-in shadow-sm border-none text-xs">
              Upgrade to Pro
            </button>}
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {cards.map((card, index) => {
          const Icon = card.icon;
          return <button key={card.id} onClick={() => onNavigate(card.id)} className={cn("group relative p-5 rounded-2xl text-left transition-all duration-300", "bg-card border border-border shadow-sm", "hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 hover:border-primary/30", "animate-slide-up")} style={{
            animationDelay: `${index * 50}ms`
          }}>
                {/* Tag */}
                {card.tag && <div className="absolute top-4 right-4">
                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground rounded-full", card.tagColor)}>
                      {card.tag}
                    </span>
                  </div>}

                {/* Icon */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", card.iconBg, "group-hover:scale-110 transition-transform")}>
                  <Icon className={cn("w-6 h-6", card.iconColor)} />
                </div>
                
                {/* Content */}
                <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                  {card.description}
                </p>
                
                {/* Launch Link */}
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Launch</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>;
        })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          {stats.map((stat, index) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="text-center p-4 animate-slide-up" style={{
            animationDelay: `${(index + cards.length) * 50}ms`
          }}>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
                  {stat.label}
                </div>
              </div>;
        })}
        </div>
      </div>
    </div>;
}