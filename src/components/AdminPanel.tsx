import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, CreditCard, Search, Filter, 
  ArrowUpDown, MoreHorizontal, Crown, Shield, Mail, Send, Loader2,
  RefreshCw, Lock, Unlock, CheckCircle, XCircle, Clock, ArrowUpCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

interface AdminPanelProps {
  isPro: boolean;
}

type EmailType = "welcome" | "upgrade" | "downgrade" | "cancelled" | "renewed";
type SubscriptionPlan = 'free' | 'plus' | 'max';

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  plan: SubscriptionPlan;
  status: string;
  start_date: string;
  amount: number;
}

interface ToolAccess {
  id: string;
  tool_id: string;
  tool_name: string;
  description: string | null;
  min_plan: SubscriptionPlan;
  is_enabled: boolean;
}

interface UpgradeRequest {
  id: string;
  user_id: string;
  user_email: string;
  current_plan: string;
  requested_plan: string;
  status: string;
  message: string | null;
  created_at: string;
}

const emailTypeLabels: Record<EmailType, string> = {
  welcome: "Welcome Email",
  upgrade: "Upgrade Confirmation",
  downgrade: "Downgrade Notice",
  cancelled: "Cancellation Notice",
  renewed: "Renewal Confirmation",
};

const planAmounts: Record<SubscriptionPlan, number> = {
  free: 0,
  plus: 20,
  max: 50,
};

export function AdminPanel({ isPro }: AdminPanelProps) {
  const { isAdmin, isLoading: subLoading, refreshSubscription } = useSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Subscription | null>(null);
  const [emailType, setEmailType] = useState<EmailType>("welcome");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [toolAccess, setToolAccess] = useState<ToolAccess[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    proMembers: 0,
    revenue: 0,
    pendingRequests: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subscriptions with user_email column
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, user_id, user_email, plan, status, start_date, amount')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      const subscriptionsData: Subscription[] = (subs || []).map(sub => ({
        ...sub,
        user_email: sub.user_email || sub.user_id.slice(0, 8) + '...',
        plan: sub.plan as SubscriptionPlan,
      }));

      setSubscriptions(subscriptionsData);

      // Calculate stats
      const active = subscriptionsData.filter(s => s.status === 'active').length;
      const pro = subscriptionsData.filter(s => s.plan !== 'free' && s.status === 'active').length;
      const revenue = subscriptionsData
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      // Fetch upgrade requests
      const { data: requests, error: reqError } = await supabase
        .from('upgrade_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setUpgradeRequests((requests || []) as UpgradeRequest[]);

      const pendingRequests = (requests || []).filter(r => r.status === 'pending').length;

      setStats({
        totalUsers: subscriptionsData.length,
        activeSubscriptions: active,
        proMembers: pro,
        revenue,
        pendingRequests,
      });

      // Fetch tool access
      const { data: tools, error: toolsError } = await supabase
        .from('tool_access')
        .select('*')
        .order('tool_name');

      if (toolsError) throw toolsError;
      setToolAccess((tools || []) as ToolAccess[]);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = !filterPlan || sub.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "max": return "default";
      case "plus": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "approved": return "default";
      case "pending": return "secondary";
      default: return "destructive";
    }
  };

  const handleOpenEmailDialog = (subscription: Subscription) => {
    setSelectedUser(subscription);
    setEmailType("welcome");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedUser) return;
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-subscription-email", {
        body: {
          email: selectedUser.user_email,
          type: emailType,
          planName: selectedUser.plan,
        },
      });

      if (error) throw error;

      toast.success(`${emailTypeLabels[emailType]} sent to ${selectedUser.user_email}`);
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateSubscription = async (subscription: Subscription, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          plan: newPlan, 
          amount: planAmounts[newPlan],
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success(`Updated ${subscription.user_email} to ${newPlan} plan`);
      fetchData();
      refreshSubscription();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
    }
  };

  const handleToggleStatus = async (subscription: Subscription) => {
    const newStatus = subscription.status === 'active' ? 'cancelled' : 'active';
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'cancelled'}`);
      fetchData();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleToggleToolAccess = async (tool: ToolAccess) => {
    try {
      const { error } = await supabase
        .from('tool_access')
        .update({ is_enabled: !tool.is_enabled })
        .eq('id', tool.id);

      if (error) throw error;

      toast.success(`${tool.tool_name} ${!tool.is_enabled ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error: any) {
      console.error('Error toggling tool:', error);
      toast.error(error.message || 'Failed to update tool');
    }
  };

  const handleUpdateToolPlan = async (tool: ToolAccess, newPlan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('tool_access')
        .update({ min_plan: newPlan })
        .eq('id', tool.id);

      if (error) throw error;

      toast.success(`${tool.tool_name} now requires ${newPlan} plan`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating tool plan:', error);
      toast.error(error.message || 'Failed to update tool');
    }
  };

  const handleApproveRequest = async (request: UpgradeRequest) => {
    try {
      // Update the request status
      const { error: reqError } = await supabase
        .from('upgrade_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // Update the user's subscription - also ensure it's active
      const newPlan = request.requested_plan as SubscriptionPlan;
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ 
          plan: newPlan, 
          amount: planAmounts[newPlan],
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.user_id);

      if (subError) throw subError;

      toast.success(`Approved upgrade for ${request.user_email} to ${request.requested_plan}`);
      fetchData();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (request: UpgradeRequest) => {
    try {
      const { error } = await supabase
        .from('upgrade_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(`Rejected upgrade request from ${request.user_email}`);
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  // Show access denied for non-admins
  if (!subLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the Admin Panel. This area is restricted to administrators only.
            </p>
            <Button 
              onClick={() => window.location.href = '/app'} 
              className="w-full"
              variant="default"
            >
              <ArrowUpDown className="w-4 h-4 mr-2 rotate-90" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = upgradeRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage users and subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="text-xs">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.totalUsers}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.activeSubscriptions}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pro Members</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.proMembers}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${stats.revenue}/mo</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.pendingRequests}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Subscriptions, Requests, and Tool Access */}
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Upgrade Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tools">Tool Access</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Subscriptions</CardTitle>
                    <CardDescription>View and manage user subscriptions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="w-4 h-4" />
                          {filterPlan ? filterPlan.charAt(0).toUpperCase() + filterPlan.slice(1) : "All Plans"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setFilterPlan(null)}>All Plans</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPlan("free")}>Free</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPlan("plus")}>Plus</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterPlan("max")}>Max</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            <Button variant="ghost" size="sm" className="gap-1 -ml-3">
                              Email <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.user_email}</TableCell>
                            <TableCell>
                              <Select
                                value={sub.plan}
                                onValueChange={(value) => handleUpdateSubscription(sub, value as SubscriptionPlan)}
                              >
                                <SelectTrigger className="w-24">
                                  <Badge variant={getPlanBadgeVariant(sub.plan)} className="capitalize">
                                    {sub.plan}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="plus">Plus</SelectItem>
                                  <SelectItem value="max">Max</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(sub.status)} className="capitalize">
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(sub.start_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {sub.amount > 0 ? `$${sub.amount}/mo` : 'Free'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleOpenEmailDialog(sub)}
                                  title="Send Email"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEmailDialog(sub)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleToggleStatus(sub)}>
                                      {sub.status === 'active' ? (
                                        <>
                                          <Lock className="w-4 h-4 mr-2" />
                                          Cancel Subscription
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="w-4 h-4 mr-2" />
                                          Activate Subscription
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredSubscriptions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No subscriptions found.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-border/50">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">Upgrade Requests</CardTitle>
                  <CardDescription>Review and approve user upgrade requests</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : upgradeRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowUpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upgrade requests yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Plan</TableHead>
                        <TableHead>Requested Plan</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upgradeRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{request.current_plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPlanBadgeVariant(request.requested_plan)} className="capitalize">
                              {request.requested_plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {request.message || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApproveRequest(request)}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectRequest(request)}
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card className="border-border/50">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">Tool Access Control</CardTitle>
                  <CardDescription>Control which subscription plans can access each tool</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Tool</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Minimum Plan</TableHead>
                        <TableHead className="w-[100px]">Enabled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toolAccess.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-medium">{tool.tool_name}</TableCell>
                          <TableCell className="text-muted-foreground">{tool.description}</TableCell>
                          <TableCell>
                            <Select
                              value={tool.min_plan}
                              onValueChange={(value) => handleUpdateToolPlan(tool, value as SubscriptionPlan)}
                            >
                              <SelectTrigger className="w-28">
                                <Badge variant={getPlanBadgeVariant(tool.min_plan)} className="capitalize">
                                  {tool.min_plan}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="plus">Plus</SelectItem>
                                <SelectItem value="max">Max</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={tool.is_enabled}
                              onCheckedChange={() => handleToggleToolAccess(tool)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Email Notification
            </DialogTitle>
            <DialogDescription>
              Send a subscription-related email to {selectedUser?.user_email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient</label>
              <Input value={selectedUser?.user_email || ""} disabled />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Plan</label>
              <Input value={selectedUser?.plan || ""} disabled className="capitalize" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Type</label>
              <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="upgrade">Upgrade Confirmation</SelectItem>
                  <SelectItem value="downgrade">Downgrade Notice</SelectItem>
                  <SelectItem value="cancelled">Cancellation Notice</SelectItem>
                  <SelectItem value="renewed">Renewal Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending} className="gap-2">
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
