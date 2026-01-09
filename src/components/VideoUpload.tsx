import { useState, useCallback } from "react";
import { Upload, Film, X, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  selectedVideo: File | null;
  onClear: () => void;
}

export function VideoUpload({ onVideoSelect, selectedVideo, onClear }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        onVideoSelect(file);
      }
    }
  }, [onVideoSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onVideoSelect(files[0]);
    }
  }, [onVideoSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedVideo) {
    return (
      <div className="relative bg-secondary/50 rounded-2xl border border-border p-5 animate-scale-in">
        <button
          onClick={onClear}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-gradient-primary">
            <FileVideo className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{selectedVideo.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(selectedVideo.size)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-secondary/30"
      )}
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="p-10 flex flex-col items-center justify-center gap-4">
        <div className={cn(
          "p-4 rounded-2xl transition-all duration-200",
          isDragging 
            ? "bg-gradient-primary text-primary-foreground"
            : "bg-secondary group-hover:bg-primary/10"
        )}>
          <Upload className={cn(
            "w-8 h-8 transition-colors duration-200",
            isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1">
            {isDragging ? "Drop your video here" : "Drag and drop your video"}
          </p>
          <p className="text-sm text-muted-foreground">or click to browse files</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {["MP4", "AVI", "MOV", "WebM"].map((format) => (
            <span
              key={format}
              className="px-2.5 py-1 text-xs font-medium bg-secondary rounded-lg text-muted-foreground"
            >
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}