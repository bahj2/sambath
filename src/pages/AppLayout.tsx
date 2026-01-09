import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AppView } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { VideoDubber } from "@/components/VideoDubber";
import { Translator } from "@/components/TranslatorView";
import { LiveVoice } from "@/components/LiveVoice";
import { PlaceholderView } from "@/components/PlaceholderView";
import { VoiceClone } from "@/components/VoiceClone";
import { SpeechSynth } from "@/components/SpeechSynth";
import { SpeechToText } from "@/components/SpeechToText";
import { SpeechToSpeech } from "@/components/SpeechToSpeech";
import { KhmerVoiceTranslator } from "@/components/KhmerVoiceTranslator";
import { ImageGen } from "@/components/ImageGen";
import { DocumentAI } from "@/components/DocumentAI";
import { VideoToKhmer } from "@/components/VideoToKhmer";
import { WatermarkRemover } from "@/components/WatermarkRemover";
import { ImageWatermarkRemover } from "@/components/ImageWatermarkRemover";
import { VeoCinematicLab } from "@/components/VeoCinematicLab";
import { Veo3VideoGen } from "@/components/Veo3VideoGen";
import { VideoUnderstanding } from "@/components/VideoUnderstanding";
import { Pricing } from "@/components/Pricing";
import { AdminPanel } from "@/components/AdminPanel";
import { KlingVideoGen } from "@/components/KlingVideoGen";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeRequestButton } from "@/components/UpgradeRequestButton";

// Tool ID mapping for access control
const viewToToolId: Partial<Record<AppView, string>> = {
  [AppView.SPEECH_SYNTH]: 'speech-synth',
  [AppView.SPEECH_TO_TEXT]: 'speech-to-text',
  [AppView.TRANSLATOR]: 'translator',
  [AppView.VIDEO_GEN]: 'video-gen',
  [AppView.IMAGE_GEN]: 'image-gen',
  [AppView.DOCUMENT_AI]: 'document-ai',
  [AppView.VOICE_CLONE]: 'voice-clone',
  [AppView.VIDEO_TRANSLATOR]: 'video-dubber',
  [AppView.WATERMARK_REMOVER]: 'watermark-remover',
  [AppView.IMAGE_WATERMARK_REMOVER]: 'image-watermark',
  [AppView.VEO3_VIDEO_GEN]: 'veo-video',
  [AppView.VIDEO_INSIGHTS]: 'cinematic-lab',
  [AppView.VIDEO_UNDERSTANDING]: 'video-understanding',
};

function LockedToolView({ toolName, onUpgrade }: { toolName: string; onUpgrade: () => void }) {
  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Tool Locked</h2>
          <p className="text-muted-foreground mb-4">
            {toolName} requires a higher subscription plan. 
            Upgrade your plan to unlock this feature.
          </p>
          <div className="space-y-2">
            <Button onClick={onUpgrade} className="w-full">
              View Plans
            </Button>
            <UpgradeRequestButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AppLayoutContent() {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [showPricing, setShowPricing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { plan, isAdmin, canAccessTool, toolAccess, refreshSubscription } = useSubscription();
  
  // Derive isPro from subscription plan
  const isPro = plan === 'plus' || plan === 'max' || isAdmin;

  // Check if this is a new user (first time seeing the app)
  useEffect(() => {
    if (user) {
      const hasSeenPricing = localStorage.getItem(`pricing_seen_${user.id}`);
      if (!hasSeenPricing) {
        setIsNewUser(true);
        setShowPricing(true);
      }
    }
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    // Mark that user has seen pricing
    if (user) {
      localStorage.setItem(`pricing_seen_${user.id}`, 'true');
    }
    
    if (planId === 'plus' || planId === 'max') {
      toast.success(`Welcome to Bath AI ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`);
    } else {
      toast.success("Welcome to Bath AI Basic!");
    }
    setShowPricing(false);
    setIsNewUser(false);
    await refreshSubscription();
  };

  const handleSkipPricing = () => {
    if (user) {
      localStorage.setItem(`pricing_seen_${user.id}`, 'true');
    }
    setShowPricing(false);
    setIsNewUser(false);
  };

  const handleNavigate = (view: AppView) => {
    if (view === AppView.PREMIUM || view === AppView.BUILD) {
      setShowPricing(true);
    } else {
      setActiveView(view);
    }
  };

  const getToolName = (view: AppView): string => {
    const toolId = viewToToolId[view];
    if (!toolId) return view;
    const tool = toolAccess.find(t => t.tool_id === toolId);
    return tool?.tool_name || view;
  };

  const renderView = () => {
    // Check tool access for protected views
    const toolId = viewToToolId[activeView];
    if (toolId && !canAccessTool(toolId)) {
      return (
        <LockedToolView 
          toolName={getToolName(activeView)} 
          onUpgrade={() => setShowPricing(true)} 
        />
      );
    }

    switch (activeView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={handleNavigate} isPro={isPro} />;
      case AppView.VIDEO_TRANSLATOR:
        return <VideoDubber isPro={isPro} />;
      case AppView.TRANSLATOR:
        return <Translator isPro={isPro} />;
      case AppView.LIVE_VOICE:
        return <LiveVoice isPro={isPro} />;
      case AppView.VOICE_CLONE:
        return <VoiceClone isPro={isPro} />;
      case AppView.SPEECH_SYNTH:
        return <SpeechSynth isPro={isPro} />;
      case AppView.SPEECH_TO_TEXT:
        return <SpeechToText isPro={isPro} />;
      case AppView.SPEECH_TO_SPEECH:
        return <SpeechToSpeech isPro={isPro} />;
      case AppView.KHMER_VOICE:
        return <KhmerVoiceTranslator isPro={isPro} />;
      case AppView.IMAGE_GEN:
        return <ImageGen isPro={isPro} />;
      case AppView.DOCUMENT_AI:
        return <DocumentAI isPro={isPro} />;
      case AppView.VIDEO_TO_KHMER:
        return <VideoToKhmer isPro={isPro} />;
      case AppView.WATERMARK_REMOVER:
        return <WatermarkRemover isPro={isPro} />;
      case AppView.IMAGE_WATERMARK_REMOVER:
        return <ImageWatermarkRemover isPro={isPro} />;
      case AppView.VIDEO_INSIGHTS:
        return <PlaceholderView title="Visual Intelligence" subtitle="AI-powered video analysis" icon="eye" />;
      case AppView.VIDEO_UNDERSTANDING:
        return <VideoUnderstanding isPro={isPro} />;
      case AppView.VIDEO_GEN:
        return <VeoCinematicLab isPro={isPro} />;
      case AppView.VEO3_VIDEO_GEN:
        return <Veo3VideoGen isPro={isPro} />;
      case AppView.KLING_VIDEO_GEN:
        return <KlingVideoGen isPro={isPro} />;
      case AppView.ADMIN:
        return <AdminPanel isPro={isPro} />;
      case AppView.API_HUB:
        return <PlaceholderView title="API Integration Hub" subtitle="Connect to 100+ AI services" icon="plug" />;
      case AppView.SETTINGS:
        return <PlaceholderView title="Settings" subtitle="Configure your workspace" icon="settings" />;
      default:
        return <Dashboard onNavigate={handleNavigate} isPro={isPro} />;
    }
  };

  const handleBackFromPricing = () => {
    setShowPricing(false);
  };

  // Show pricing page for new users or when requested
  if (showPricing) {
    return (
      <Pricing 
        onSelectPlan={handleSelectPlan} 
        onSkip={isNewUser ? handleSkipPricing : undefined}
        onBack={!isNewUser ? handleBackFromPricing : undefined}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar 
        activeView={activeView} 
        onViewChange={handleNavigate} 
        isPro={isPro}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className={cn(
        "flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden",
        "transition-all duration-300 ease-out"
      )}>
        {renderView()}
      </main>
    </div>
  );
}

const AppLayout = () => {
  return (
    <SubscriptionProvider>
      <AppLayoutContent />
    </SubscriptionProvider>
  );
};

export default AppLayout;
