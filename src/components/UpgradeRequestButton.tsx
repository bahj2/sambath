import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

type SubscriptionPlan = 'free' | 'plus' | 'max';

export function UpgradeRequestButton() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [open, setOpen] = useState(false);
  const [requestedPlan, setRequestedPlan] = useState<SubscriptionPlan>('plus');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availablePlans = (): SubscriptionPlan[] => {
    if (plan === 'free') return ['plus', 'max'];
    if (plan === 'plus') return ['max'];
    return [];
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('upgrade_requests')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          current_plan: plan,
          requested_plan: requestedPlan,
          message: message || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Upgrade request submitted! Admin will review it soon.');
      
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage('');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show if already on max plan
  if (plan === 'max') return null;

  const plans = availablePlans();
  if (plans.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpCircle className="w-4 h-4" />
          Request Upgrade
        </Button>
      </DialogTrigger>
      <DialogContent>
        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Request Submitted!</h3>
            <p className="text-muted-foreground mt-2">
              An admin will review your request and get back to you soon.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5" />
                Request Plan Upgrade
              </DialogTitle>
              <DialogDescription>
                Submit a request to upgrade your subscription plan. An admin will review and approve it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Plan</label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                  {plan}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Requested Plan</label>
                <Select value={requestedPlan} onValueChange={(v) => setRequestedPlan(v as SubscriptionPlan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.includes('plus') && (
                      <SelectItem value="plus">Plus - $20/month</SelectItem>
                    )}
                    {plans.includes('max') && (
                      <SelectItem value="max">Max - $50/month</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message (optional)</label>
                <Textarea
                  placeholder="Tell us why you'd like to upgrade..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4" />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
