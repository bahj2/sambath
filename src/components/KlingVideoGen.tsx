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

interface KlingVideoGenProps {
  isPro: boolean;
}

const aspectRatios = [
  { value: "16:9", label: "16:9 Widescreen", icon: "🎬" },
  { value: "9:16", label: "9:16 Vertical", icon: "📱" },
  { value: "1:1", label: "1:1 Square", icon: "⬜" },
  { value: "4:3", label: "4:3 Standard", icon: "📺" },
];

const promptExamples = [
  "A mystical dragon soaring through a lightning storm with epic cinematic lighting",
  "Neon-lit cyberpunk street with holographic advertisements and flying vehicles",
  "A peaceful zen garden with cherry blossoms falling in slow motion",
  "Underwater scene with bioluminescent jellyfish in deep ocean darkness",
  "Time-lapse of a blooming flower opening its petals at sunrise",
  "Futuristic space station orbiting a distant alien planet with purple atmosphere",
];

export function KlingVideoGen({ isPro }: KlingVideoGenProps) {
  const [activeTab, setActiveTab] = useState<"text-to-video" | "image-to-video">("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
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
      const { data, error } = await supabase.functions.invoke("kling-video-gen", {
        body: {
          prompt,
          negativePrompt,
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
      toast.success("Video generation plan created! 🎬");
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
    const content = `KLING AI VIDEO GENERATION PLAN
================================

Prompt: ${result.prompt}
${result.negativePrompt ? `Negative Prompt: ${result.negativePrompt}` : ''}
Mode: ${result.mode}
Duration: ${result.settings.duration}s
Aspect Ratio: ${result.settings.aspectRatio}
Resolution: ${result.settings.resolution}
FPS: ${result.settings.fps}
Audio: ${result.settings.generateAudio ? "Enabled" : "Disabled"}

GENERATION PLAN
---------------
${result.generationPlan}

SCENE BREAKDOWN
---------------
${result.sceneBreakdown.map((scene: any) => `[${scene.timeRange}] ${scene.description}`).join('\n')}

CAMERA MOVEMENTS
----------------
${result.cameraMovements.map((cam: any, idx: number) => `${idx + 1}. ${cam}`).join('\n')}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kling-video-plan.txt";
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
          <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Kling AI Video Generator
          </h1>
          <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-full">
            NEW
          </span>
        </div>
        <p className="text-muted-foreground">
          Create cinematic AI videos with Kling AI's advanced text-to-video technology
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
                  placeholder="A majestic phoenix rising from flames in a dark cave, ultra-detailed feathers glowing with fire, dramatic lighting, 4K cinematic quality..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Describe the scene, action, style, lighting, and mood for optimal results.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Negative Prompt (Optional)
                </label>
                <Textarea
                  placeholder="blurry, low quality, distorted, artifacts, watermark..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Specify what you don't want in the video.
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
                      {example.slice(0, 40)}...
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
                  Describe the motion and action
                </label>
                <Textarea
                  placeholder="Camera slowly zooms in while the character turns to face the viewer, wind blowing hair dramatically..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Negative Prompt (Optional)
                </label>
                <Textarea
                  placeholder="static image, no movement, blur, distortion..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[60px] resize-none"
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
                min={5}
                max={10}
                step={1}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5s</span>
                <span>10s</span>
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
          className="px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Video Plan
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <Card className="mt-6 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-foreground">Generation Plan</h3>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-full">
                {result.settings.aspectRatio} • {result.settings.duration}s • {result.settings.fps}fps
              </span>
              {result.settings.generateAudio && (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Audio
                </span>
              )}
            </div>

            {/* Scene Breakdown */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Scene Breakdown</span>
              </div>
              <div className="space-y-2">
                {result.sceneBreakdown.map((scene: any, idx: number) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-background rounded border text-xs"
                  >
                    <div className="font-mono font-bold text-blue-500">{scene.timeRange}</div>
                    <div className="text-muted-foreground">{scene.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera Movements */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Camera Movements</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {result.cameraMovements.map((movement: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">{idx + 1}.</span>
                    <span>{movement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Generation Plan */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">
                {result.generationPlan}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.generationPlan)}
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

            <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-blue-500">Ready for processing:</strong> {result.message} 
                Estimated generation time: ~{result.estimatedGenerationTime} seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
