// src/components/BillingSettings.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Crown, AlertTriangle } from "lucide-react";

interface BillingSettingsProps {
  subscriptionTier: "free" | "pro" | "enterprise";
  uploadQuota: number;
  uploadsUsed: number;
  stripeCustomerId: string | null;
}

export const BillingSettings = ({
  subscriptionTier,
  uploadQuota,
  uploadsUsed,
  stripeCustomerId,
}: BillingSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const tierInfo = {
    free: {
      name: "Free Plan",
      color: "bg-gray-500",
      description: "3 projects per month",
    },
    pro: {
      name: "Pro Plan",
      color: "bg-blue-500",
      description: "50 projects per month",
    },
    enterprise: {
      name: "Enterprise Plan",
      color: "bg-purple-500",
      description: "Unlimited projects",
    },
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) {
      toast({
        title: "No Active Subscription",
        description: "You don't have an active subscription to manage.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-portal",
        {}
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = "/pricing";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription & Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing settings
            </CardDescription>
          </div>
          <Badge className={`${tierInfo[subscriptionTier].color} text-white`}>
            {subscriptionTier === "enterprise" && (
              <Crown className="w-3 h-3 mr-1" />
            )}
            {tierInfo[subscriptionTier].name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Plan</span>
            <span className="text-sm text-muted-foreground">
              {tierInfo[subscriptionTier].description}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Usage This Month</span>
            <span className="text-sm text-muted-foreground">
              {uploadsUsed} /{" "}
              {subscriptionTier === "enterprise" ? "∞" : uploadQuota} projects
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscriptionTier === "free" ? (
            <Button onClick={handleUpgrade} className="flex-1">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button
                onClick={handleManageBilling}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                className="flex-1"
              >
                Cancel Subscription
              </Button>
            </>
          )}
        </div>

        {/* Info Messages */}
        {subscriptionTier !== "free" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p>
              In the billing portal, you can update payment method, view
              invoices, and manage your subscription.
            </p>
          </div>
        )}

        {uploadsUsed >= uploadQuota && subscriptionTier !== "enterprise" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Quota Limit Reached</p>
              <p className="text-xs mt-1">
                You've reached your monthly upload limit. Upgrade to continue
                creating AR projects.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll continue
              to have access until the end of your billing period, then you'll
              be downgraded to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManageBilling}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue to Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
