import { useState, useEffect } from "react";
import { Check, Loader2, AudioWaveform, Languages, Volume2, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const steps: Step[] = [
  { id: "extract", label: "Extract Audio", icon: AudioWaveform, description: "Extracting audio from video..." },
  { id: "transcribe", label: "Transcribe", icon: Volume2, description: "Converting speech to text..." },
  { id: "translate", label: "Translate", icon: Languages, description: "Translating to target language..." },
  { id: "synthesize", label: "Synthesize", icon: Volume2, description: "Generating translated speech..." },
  { id: "merge", label: "Merge Video", icon: Film, description: "Combining video with new audio..." },
];

interface TranslationProgressProps {
  isProcessing: boolean;
  onComplete?: () => void;
}

export function TranslationProgress({ isProcessing, onComplete }: TranslationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
            return 0;
          } else {
            clearInterval(progressInterval);
            onComplete?.();
            return 100;
          }
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [isProcessing, currentStep, onComplete]);

  const overallProgress = ((currentStep * 100 + progress) / (steps.length * 100)) * 100;

  return (
    <div className="bg-secondary/30 rounded-2xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Translation Progress</h3>
        <span className="text-sm font-medium text-primary">{Math.round(overallProgress)}%</span>
      </div>

      <Progress value={overallProgress} className="h-2" />

      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep || (index === currentStep && progress >= 100);
          const isActive = index === currentStep && !isCompleted;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200",
                isActive && "bg-primary/5 border border-primary/20",
                isCompleted && "opacity-60"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isCompleted && "bg-primary/20 text-primary",
                isActive && "bg-gradient-primary text-primary-foreground",
                isPending && "bg-secondary text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-sm text-primary animate-fade-in">{step.description}</p>
                )}
              </div>
              {isActive && (
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}