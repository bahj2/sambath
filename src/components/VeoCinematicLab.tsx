import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VeoCinematicLabProps {
  isPro: boolean;
}

const aspectRatios = [
  { value: "16:9", label: "16:9 Widescreen", icon: "🎬" },
  { value: "9:16", label: "9:16 Vertical", icon: "📱" },
  { value: "1:1", label: "1:1 Square", icon: "⬜" },
  { value: "4:3", label: "4:3 Standard", icon: "📺" },
  { value: "21:9", label: "21:9 Cinematic", icon: "🎥" },
];

const durationOptions = [
  { value: 5, label: "5 seconds" },
  { value: 10, label: "10 seconds" },
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
];

const promptSuggestions = [
  "A majestic dragon soaring through golden sunset clouds",
  "Underwater city with bioluminescent coral and fish",
  "Time-lapse of a flower blooming in magical forest",
  "Astronaut floating in space with Earth in background",
  "Ancient temple ruins being reclaimed by nature",
  "Cyberpunk city street with neon lights and rain",
];

export function VeoCinematicLab({ isPro }: VeoCinematicLabProps) {
  const [activeTab, setActiveTab] = useState<"text-to-video" | "image-to-video">("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(10);
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
      const { data, error } = await supabase.functions.invoke("veo-video-gen", {
        body: {
          prompt,
          mode: activeTab,
          imageBase64: uploadedImage,
          duration,
          aspectRatio,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success("Video concept generated! 🎬");
    } catch (error) {
      console.error("Generation error:", error);
      const message = error instanceof Error ? error.message : "Generation failed";
      if (message.includes("rate limit") || message.includes("Rate limit")) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    toast.info("Prompt added!");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Veo Cinematic Lab
          </h1>
        </div>
        <p className="text-muted-foreground">
          Create stunning AI-generated videos from text or images using Google AI
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
              {/* Prompt Input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe your video
                </label>
                <Textarea
                  placeholder="A cinematic shot of a golden sunset over mountains, with clouds slowly drifting..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be descriptive! Include camera movements, lighting, mood, and action.
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Need inspiration?
                </label>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {suggestion.slice(0, 30)}...
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
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Upload an image to animate
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
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP supported
                    </p>
                  </div>
                )}
              </div>

              {/* Motion Prompt */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe the motion/animation
                </label>
                <Textarea
                  placeholder="Slow zoom in with gentle camera movement, clouds drifting in the background..."
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
          <div className="grid md:grid-cols-2 gap-6">
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
                max={30}
                step={5}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5s</span>
                <span>30s</span>
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
          className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Video Concept
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <Card className="mt-6 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {result.mode === "text-to-video" ? "Storyboard" : "Motion Description"}
              </h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {result.aspectRatio} • {result.duration}s
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                {result.storyboard || result.motionDescription}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.storyboard || result.motionDescription)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([result.storyboard || result.motionDescription], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "video-concept.txt";
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>

            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> {result.message} Estimated processing time: ~{result.estimatedTime} seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
