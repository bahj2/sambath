import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Video, 
  Upload, 
  Wand2, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  Film,
  Clock,
  RectangleHorizontal,
  FileText,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Play,
  Clapperboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Veo3VideoGenProps {
  isPro: boolean;
}

const aspectRatios = [
  { value: "16:9", label: "16:9 Widescreen", icon: "🎬" },
  { value: "9:16", label: "9:16 Vertical", icon: "📱" },
  { value: "1:1", label: "1:1 Square", icon: "⬜" },
  { value: "4:3", label: "4:3 Standard", icon: "📺" },
  { value: "21:9", label: "21:9 Ultrawide", icon: "🎥" },
];

const promptExamples = [
  "Cinematic drone shot over misty mountains at sunrise, golden hour lighting",
  "A futuristic city at night with flying cars and neon holographic billboards",
  "Slow-motion water droplet falling into a still pond with ripple effects",
  "Time-lapse of northern lights dancing over a frozen lake in Iceland",
  "A magical forest with floating glowing orbs and ethereal fog",
  "Underwater coral reef with colorful tropical fish swimming peacefully",
];

export function Veo3VideoGen({ isPro }: Veo3VideoGenProps) {
  const [activeTab, setActiveTab] = useState<"text-to-video" | "image-to-video">("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(8);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadedImage(base64);
      setImagePreview(reader.result as string);
      toast.success("Image uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (activeTab === "image-to-video" && !uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("veo3-video-gen", {
        body: {
          prompt,
          mode: activeTab,
          imageBase64: uploadedImage,
          duration,
          aspectRatio,
          generateAudio,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success("Video production plan generated! 🎬");
    } catch (error) {
      console.error("Generation error:", error);
      const message = error instanceof Error ? error.message : "Generation failed";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadPlan = () => {
    if (!result) return;
    const content = `VEO 3 VIDEO PRODUCTION PLAN
=============================

Prompt: ${result.prompt}
Mode: ${result.mode}
Duration: ${result.settings.duration}s
Aspect Ratio: ${result.settings.aspectRatio}
Resolution: ${result.settings.resolution}
FPS: ${result.settings.fps}
Audio: ${result.settings.generateAudio ? "Enabled" : "Disabled"}

PRODUCTION PLAN
---------------
${result.productionPlan}

KEYFRAMES
---------
${result.keyframes.map((kf: any) => `${kf.time}s - ${kf.description}`).join('\n')}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veo3-production-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    toast.info("Prompt added!");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Veo 3 Video Generator
          </h1>
          <span className="px-2 py-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-full">
            NEW
          </span>
        </div>
        <p className="text-muted-foreground">
          Create stunning AI-generated videos with Google's latest Veo 3 technology
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-video" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Text to Video
          </TabsTrigger>
          <TabsTrigger value="image-to-video" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Image to Video
          </TabsTrigger>
        </TabsList>

        {/* Text to Video Tab */}
        <TabsContent value="text-to-video" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe your video scene
                </label>
                <Textarea
                  placeholder="A cinematic drone shot flying through ancient ruins covered in jungle vines, golden sunlight filtering through the canopy..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be specific about camera movements, lighting, mood, and action for best results.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Quick prompts
                </label>
                <div className="flex flex-wrap gap-2">
                  {promptExamples.slice(0, 3).map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => useSuggestion(example)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {example.slice(0, 35)}...
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image to Video Tab */}
        <TabsContent value="image-to-video" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Upload a starting frame
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (max 10MB)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe the motion
                </label>
                <Textarea
                  placeholder="Gentle zoom in with subtle parallax effect, clouds slowly drifting across the sky..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Aspect Ratio */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <RectangleHorizontal className="w-4 h-4" />
                Aspect Ratio
              </label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      <span className="flex items-center gap-2">
                        <span>{ratio.icon}</span>
                        <span>{ratio.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration: {duration}s
              </label>
              <Slider
                value={[duration]}
                onValueChange={(v) => setDuration(v[0])}
                min={4}
                max={16}
                step={2}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>4s</span>
                <span>16s</span>
              </div>
            </div>

            {/* Audio Toggle */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                {generateAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Generate Audio
              </label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="audio-toggle"
                  checked={generateAudio}
                  onCheckedChange={setGenerateAudio}
                />
                <Label htmlFor="audio-toggle" className="text-sm text-muted-foreground">
                  {generateAudio ? "Audio enabled" : "Silent video"}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <Card className="mt-6 border-violet-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold text-foreground">Production Plan</h3>
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-500 text-xs rounded-full">
                {result.settings.aspectRatio} • {result.settings.duration}s • {result.settings.fps}fps
              </span>
              {result.settings.generateAudio && (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Audio
                </span>
              )}
            </div>

            {/* Keyframes Timeline */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Timeline Keyframes</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {result.keyframes.map((kf: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 px-3 py-2 bg-background rounded border text-xs"
                  >
                    <div className="font-mono font-bold text-violet-500">{kf.time}s</div>
                    <div className="text-muted-foreground">{kf.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">
                {result.productionPlan}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.productionPlan)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPlan}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>

            <div className="mt-4 p-3 bg-violet-500/5 rounded-lg border border-violet-500/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-violet-500">Ready for rendering:</strong> {result.message} 
                Estimated render time: ~{result.estimatedRenderTime} seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
