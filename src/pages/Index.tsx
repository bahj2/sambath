import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Globe2, AudioWaveform, Download, CheckCircle2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { VideoUpload } from "@/components/VideoUpload";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslationProgress } from "@/components/TranslationProgress";
import { FeatureCard } from "@/components/FeatureCard";
import { toast } from "sonner";
import bathAiLogo from "@/assets/bath-ai-logo.png";

const Index = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("km");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleStartTranslation = () => {
    if (!selectedVideo) {
      toast.error("Please upload a video first");
      return;
    }
    setIsProcessing(true);
    setIsComplete(false);
  };

  const handleComplete = () => {
    setIsProcessing(false);
    setIsComplete(true);
    toast.success("Translation complete! Your video is ready to download.");
  };

  const handleReset = () => {
    setSelectedVideo(null);
    setIsProcessing(false);
    setIsComplete(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                AI-Powered Video Dubbing
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 animate-fade-in leading-tight" style={{ animationDelay: "100ms" }}>
                Translate Videos
                <span className="block text-gradient">Into Any Language</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
                Upload your video and let AI handle the rest. Speech recognition, 
                translation, and voice synthesis – all in one seamless workflow.
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    Start Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2">
                  <Play className="w-4 h-4" /> Watch Demo
                </Button>
              </div>
            </div>

            {/* Main Translation Interface */}
            <div className="max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="bg-background rounded-3xl border border-border shadow-lg p-6 md:p-8">
                {/* Video Upload */}
                <div className="mb-6">
                  <VideoUpload
                    onVideoSelect={setSelectedVideo}
                    selectedVideo={selectedVideo}
                    onClear={() => setSelectedVideo(null)}
                  />
                </div>

                {/* Language Selection */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <LanguageSelector
                    type="source"
                    selected={sourceLanguage}
                    onSelect={setSourceLanguage}
                  />
                  <LanguageSelector
                    type="target"
                    selected={targetLanguage}
                    onSelect={setTargetLanguage}
                  />
                </div>

                {/* Action Area */}
                {isProcessing ? (
                  <TranslationProgress isProcessing={isProcessing} onComplete={handleComplete} />
                ) : isComplete ? (
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                    <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Translation Complete!</h3>
                    <p className="text-muted-foreground mb-6">Your video has been successfully translated.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button size="lg">
                        <Download className="w-5 h-5" />
                        Download Video
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleReset}>
                        Translate Another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={handleStartTranslation}
                    disabled={!selectedVideo}
                  >
                    Start Translation
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Bath AI?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Professional-grade video translation powered by cutting-edge AI technology.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <FeatureCard
                icon={Zap}
                title="Lightning Fast"
                description="Process videos up to 10 minutes in just a few minutes using optimized AI."
                delay={0}
              />
              <FeatureCard
                icon={Globe2}
                title="8+ Languages"
                description="Support for Khmer, Vietnamese, Chinese, Japanese, Korean, and more."
                delay={100}
              />
              <FeatureCard
                icon={AudioWaveform}
                title="Natural Voice"
                description="Advanced text-to-speech creates natural-sounding dubbed audio."
                delay={200}
              />
              <FeatureCard
                icon={Shield}
                title="Secure & Private"
                description="Your videos are processed securely and never stored."
                delay={300}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center bg-gradient-primary rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Ready to translate your first video?
                </h2>
                <p className="text-lg text-primary-foreground/80 mb-8">
                  Start for free. No credit card required.
                </p>
                <Link to="/register">
                  <Button variant="glass" size="lg" className="bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={bathAiLogo} alt="Bath AI" className="w-8 h-8 object-contain" />
                <span className="text-sm text-muted-foreground">© 2024 Bath AI. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Docs</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;