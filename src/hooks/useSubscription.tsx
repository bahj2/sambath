import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type SubscriptionPlan = 'free' | 'plus' | 'max';

interface ToolAccess {
  tool_id: string;
  tool_name: string;
  description: string | null;
  min_plan: SubscriptionPlan;
  is_enabled: boolean;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  isAdmin: boolean;
  isLoading: boolean;
  toolAccess: ToolAccess[];
  canAccessTool: (toolId: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const planHierarchy: Record<SubscriptionPlan, number> = {
  free: 0,
  plus: 1,
  max: 2,
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([]);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setPlan('free');
      setIsAdmin(false);
      setToolAccess([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      if (subscription) {
        setPlan(subscription.plan as SubscriptionPlan);
      } else {
        setPlan('free');
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
      setIsAdmin(hasAdminRole);

      // Fetch tool access configuration
      const { data: tools } = await supabase
        .from('tool_access')
        .select('*')
        .order('tool_name');

      if (tools) {
        setToolAccess(tools as ToolAccess[]);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();

    // Subscribe to realtime subscription changes
    if (user) {
      const channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('Subscription updated, refreshing...');
            fetchSubscriptionData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const canAccessTool = (toolId: string): boolean => {
    // Admins always have access
    if (isAdmin) return true;

    const tool = toolAccess.find(t => t.tool_id === toolId);
    if (!tool || !tool.is_enabled) return false;

    const userPlanLevel = planHierarchy[plan];
    const requiredPlanLevel = planHierarchy[tool.min_plan];

    return userPlanLevel >= requiredPlanLevel;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isAdmin,
        isLoading,
        toolAccess,
        canAccessTool,
        refreshSubscription: fetchSubscriptionData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
