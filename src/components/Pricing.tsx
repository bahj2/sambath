import { Check, Zap, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import bathAiLogo from "@/assets/bath-ai-logo.png";

interface PricingProps {
  onSelectPlan: (plan: string) => void;
  onSkip?: () => void;
  onBack?: () => void;
}

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 9,
    description: "Perfect for getting started",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    features: [
      "5 video translations/month",
      "Basic voice cloning",
      "Text translation (10K chars)",
      "Standard quality output",
      "Email support",
    ],
    limitations: [
      "No API access",
      "720p max resolution",
    ]
  },
  {
    id: "plus",
    name: "Plus",
    price: 29,
    description: "Most popular for creators",
    icon: Crown,
    color: "from-violet-500 to-purple-500",
    popular: true,
    features: [
      "25 video translations/month",
      "Advanced voice cloning",
      "Unlimited text translation",
      "HD quality output (1080p)",
      "Priority support",
      "Image generation (100/month)",
      "Document AI access",
    ],
    limitations: []
  },
  {
    id: "max",
    name: "Max",
    price: 79,
    description: "For professionals & teams",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    features: [
      "Unlimited video translations",
      "Premium voice cloning",
      "Unlimited everything",
      "4K quality output",
      "24/7 priority support",
      "Unlimited image generation",
      "Full API access",
      "Team collaboration",
      "Custom integrations",
    ],
    limitations: []
  }
];

export function Pricing({ onSelectPlan, onSkip, onBack }: PricingProps) {
  return (
    <div className="min-h-screen bg-background overflow-y-auto custom-scrollbar">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative px-6 py-12 lg:py-20 max-w-6xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        )}
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={bathAiLogo} alt="Bath AI" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Unlock the full power of Bath AI with a plan that fits your needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-2xl border transition-all duration-300 animate-slide-up",
                  plan.popular 
                    ? "bg-card border-primary/50 shadow-glow-sm scale-105" 
                    : "bg-card/50 border-border hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-xs font-bold uppercase bg-gradient-to-r from-primary to-accent text-white rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                  plan.color
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Info */}
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* CTA Button */}
                <Button 
                  onClick={() => onSelectPlan(plan.id)}
                  className={cn(
                    "w-full mb-6",
                    plan.popular && "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get {plan.name}
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 text-sm opacity-50">
                      <span className="w-4 h-4 flex items-center justify-center text-muted-foreground mt-0.5 flex-shrink-0">—</span>
                      <span className="text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Skip Option */}
        {onSkip && (
          <div className="text-center">
            <button 
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue with free trial →
            </button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Trusted by creators worldwide</p>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">500K+</div>
              <div className="text-xs">Active Users</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">10M+</div>
              <div className="text-xs">Videos Created</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">50+</div>
              <div className="text-xs">Languages</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}