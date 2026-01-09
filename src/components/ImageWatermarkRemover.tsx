import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ImageOff, Upload, Download, Loader2, Sparkles, X, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageWatermarkRemoverProps {
  isPro: boolean;
}

export function ImageWatermarkRemover({ isPro }: ImageWatermarkRemoverProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveWatermark = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-image-watermark", {
        body: { imageBase64: originalImage },
      });

      if (error) throw error;

      if (data.success && data.image) {
        setProcessedImage(data.image);
        toast.success("Watermark removed successfully!");
      } else {
        toast.error(data.message || "Failed to remove watermark");
      }
    } catch (error: unknown) {
      console.error("Error removing watermark:", error);
      const message = error instanceof Error ? error.message : "Failed to process image";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `no-watermark-${fileName || "image.png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const handleClear = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20">
              <ImageOff className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Image Watermark Remover</h1>
              <p className="text-sm text-muted-foreground">Remove watermarks from images using Google AI</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini
          </Badge>
        </div>

        {/* Upload Area */}
        {!originalImage && (
          <Card className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-12">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload an image with watermark</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to select. Supports JPG, PNG, WebP (max 10MB)
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button asChild>
                    <span className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Select Image
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Comparison */}
        {originalImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Image */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Original Image</CardTitle>
                    <CardDescription>{fileName}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Processed Image */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {processedImage ? "Watermark Removed" : "Result"}
                </CardTitle>
                <CardDescription>
                  {processedImage ? "AI-processed image without watermark" : "Click process to remove watermark"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Removing watermark...</p>
                    </div>
                  ) : processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="w-12 h-12 opacity-50" />
                      <p className="text-sm">Result will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        {originalImage && (
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleRemoveWatermark}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isProcessing ? "Processing..." : "Remove Watermark"}
            </Button>
            
            {processedImage && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Result
              </Button>
            )}
          </div>
        )}

        {/* Tips */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Tips for best results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Works best with semi-transparent or text watermarks</li>
              <li>• Higher resolution images produce better results</li>
              <li>• Complex watermarks covering main content may not be fully removed</li>
              <li>• The AI attempts to reconstruct the original image content</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
