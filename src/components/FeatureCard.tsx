import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div 
      className={cn(
        "group p-6 rounded-2xl bg-background border border-border",
        "hover:border-primary/30 hover:shadow-lg",
        "transition-all duration-300 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-3 rounded-xl bg-gradient-primary w-fit mb-4">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}