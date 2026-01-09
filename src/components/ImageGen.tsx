import { useState } from "react";
import { Image, Wand2, Download, Loader2, Sparkles, Grid, LayoutGrid, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ImageGenProps {
  isPro: boolean;
}

const stylePresets = [
  { id: "realistic", name: "Realistic", emoji: "📷" },
  { id: "anime", name: "Anime", emoji: "🎨" },
  { id: "3d", name: "3D Render", emoji: "🎮" },
  { id: "oil", name: "Oil Painting", emoji: "🖼️" },
  { id: "watercolor", name: "Watercolor", emoji: "💧" },
  { id: "sketch", name: "Sketch", emoji: "✏️" },
];

const aspectRatios = [
  { id: "1:1", name: "Square", width: 1024, height: 1024 },
  { id: "16:9", name: "Landscape", width: 1920, height: 1080 },
  { id: "9:16", name: "Portrait", width: 1080, height: 1920 },
  { id: "4:3", name: "Standard", width: 1024, height: 768 },
];

const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400",
];

export function ImageGen({ isPro }: ImageGenProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [steps, setSteps] = useState([30]);
  const [guidance, setGuidance] = useState([7.5]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [numImages, setNumImages] = useState(1);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Use sample images for demo
      const newImages = sampleImages.slice(0, numImages);
      setGeneratedImages(newImages);
      toast.success(`Generated ${numImages} image${numImages > 1 ? 's' : ''}!`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Diffusion Model Ready
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            AI Image <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Create stunning images from text descriptions
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Prompt & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prompt */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Prompt
              </h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-32 px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              <div className="mt-3">
                <label className="text-xs text-muted-foreground mb-1 block">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid..."
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Style Presets */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4">Style</h3>
              <div className="grid grid-cols-3 gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "p-3 rounded-xl text-center transition-all",
                      selectedStyle === style.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/50 border border-transparent hover:bg-secondary"
                    )}
                  >
                    <span className="text-lg">{style.emoji}</span>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">{style.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4">Aspect Ratio</h3>
              <div className="grid grid-cols-4 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={cn(
                      "p-2 rounded-lg text-center transition-all",
                      selectedRatio === ratio.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/50 border border-transparent hover:bg-secondary"
                    )}
                  >
                    <p className="text-xs font-medium text-foreground">{ratio.id}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Advanced
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Steps</span>
                    <span className="text-foreground font-medium">{steps[0]}</span>
                  </div>
                  <Slider value={steps} onValueChange={setSteps} min={10} max={50} step={1} />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Guidance</span>
                    <span className="text-foreground font-medium">{guidance[0].toFixed(1)}</span>
                  </div>
                  <Slider value={guidance} onValueChange={setGuidance} min={1} max={20} step={0.5} />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Number of Images</span>
                    <span className="text-foreground font-medium">{numImages}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumImages(n)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                          numImages === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Images
                </>
              )}
            </Button>
          </div>

          {/* Right - Generated Images */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-2xl bg-card/50 border border-border min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Generated Images
                </h3>
                {generatedImages.length > 0 && (
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <Grid className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Creating your images...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className={cn(
                  "grid gap-4",
                  generatedImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {generatedImages.map((img, index) => (
                    <div 
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-border animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <img 
                        src={img} 
                        alt={`Generated ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Your generated images will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}