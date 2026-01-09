import { useState } from "react";
import { User, Mail, Lock, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import bathAiLogo from "@/assets/bath-ai-logo.png";

interface BuildAgentProps {
  onComplete: () => void;
}

export function BuildAgent({ onComplete }: BuildAgentProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 justify-center">
          <img src={bathAiLogo} alt="Bath AI" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">BATH AI</h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Build Your Agent</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? 'bg-primary text-primary-foreground' : 
                s === step ? 'bg-foreground text-background' : 
                'bg-secondary text-muted-foreground'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black text-foreground text-center mb-6">What's your name?</h2>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 pl-12 text-base"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black text-foreground text-center mb-6">Your email address</h2>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 text-base"
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black text-foreground text-center mb-6">Create a password</h2>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 text-base"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-14 text-base">
            {step < 3 ? (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Complete Setup <Sparkles className="w-5 h-5" /></>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}