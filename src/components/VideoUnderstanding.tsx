import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Video, Sparkles, FileVideo, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VideoUnderstandingProps {
  isPro: boolean;
}

export function VideoUnderstanding({ isPro }: VideoUnderstandingProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Analyze this video and describe what you see in detail. Include information about: scenes, actions, objects, text, audio content, and any notable elements.");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for edge function)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file must be less than 10MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error("Please select a valid video file");
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysis(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file must be less than 10MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysis(null);
    } else {
      toast.error("Please drop a valid video file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const analyzeVideo = async () => {
    if (!videoFile) {
      toast.error("Please select a video first");
      return;
    }

    setIsAnalyzing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('prompt', prompt);

      setProgress(30);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-understanding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData
        }
      );

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setProgress(100);
      setAnalysis(data.analysis);
      toast.success("Video analyzed successfully!");
    } catch (error) {
      console.error('Video analysis error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze video");
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    if (analysis) {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearAll = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-primary/5 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Video Understanding</h1>
              <p className="text-muted-foreground">Analyze videos with Google Gemini AI</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5" />
                Upload Video
              </CardTitle>
              <CardDescription>
                Upload a video file (max 10MB) to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={cn(
                    "border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer",
                    "hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  )}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium text-foreground">
                    Click or drag video to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports MP4, WebM, MOV (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    {videoPreview && (
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {videoFile.name}
                    </span>
                    <span className="text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Video
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Analysis Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What would you like to know about this video?"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Analyzing video...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <Button
                onClick={analyzeVideo}
                disabled={!videoFile || isAnalyzing}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Analysis Results
                </span>
                {analysis && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                AI-powered video analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="bg-muted/50 rounded-xl p-4 max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm text-foreground">
                    {analysis}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Video className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Upload a video and click "Analyze Video" to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-6 border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">What can Video Understanding do?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                <span>Describe scenes, actions, and objects in videos</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <span>Extract and transcribe text and speech</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <span>Answer specific questions about video content</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
