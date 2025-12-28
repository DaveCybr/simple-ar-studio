// src/components/BillingSettings.tsx - Fixed Version
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
import {
  Loader2,
  CreditCard,
  Crown,
  AlertTriangle,
  Sparkles,
  Calendar,
} from "lucide-react";

interface BillingSettingsProps {
  subscriptionTier: "demo" | "pro" | "pro_plus"; // ✅ FIX
  uploadQuota: number;
  uploadsUsed: number;
  stripeCustomerId: string | null;
  trialEndsAt?: string | null;
  isTrialActive?: boolean;
}

export const BillingSettings = ({
  subscriptionTier,
  uploadQuota,
  uploadsUsed,
  stripeCustomerId,
  trialEndsAt,
  isTrialActive,
}: BillingSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const tierInfo = {
    demo: {
      name: "Demo Plan",
      color: "bg-gray-500",
      description: "14-day free trial",
      quota: "Unlimited (trial)",
    },
    pro: {
      name: "PRO Plan",
      color: "bg-blue-500",
      description: "20 AR-photos per month",
      quota: "20 projects/month",
    },
    pro_plus: {
      name: "PRO+ Plan",
      color: "bg-purple-500",
      description: "30 AR-photos per month",
      quota: "30 projects/month",
    },
  };

  // Calculate days remaining in trial
  const getDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();
  const isTrialExpired = subscriptionTier === "demo" && daysRemaining <= 0;

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
            {subscriptionTier === "pro_plus" && (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            {subscriptionTier === "pro" && <Crown className="w-3 h-3 mr-1" />}
            {tierInfo[subscriptionTier].name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trial Info for Demo Users */}
        {subscriptionTier === "demo" && (
          <div
            className={`p-4 rounded-lg border ${
              isTrialExpired
                ? "bg-red-50 border-red-200"
                : daysRemaining <= 3
                ? "bg-yellow-50 border-yellow-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Calendar
                className={`w-5 h-5 mt-0.5 ${
                  isTrialExpired
                    ? "text-red-600"
                    : daysRemaining <= 3
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              />
              <div className="flex-1">
                <h4
                  className={`font-semibold text-sm ${
                    isTrialExpired
                      ? "text-red-800"
                      : daysRemaining <= 3
                      ? "text-yellow-800"
                      : "text-blue-800"
                  }`}
                >
                  {isTrialExpired
                    ? "Trial Expired"
                    : `${daysRemaining} Days Remaining in Trial`}
                </h4>
                <p
                  className={`text-xs mt-1 ${
                    isTrialExpired
                      ? "text-red-700"
                      : daysRemaining <= 3
                      ? "text-yellow-700"
                      : "text-blue-700"
                  }`}
                >
                  {isTrialExpired
                    ? "Your trial has ended. Upgrade to continue using premium features."
                    : `Your trial ends on ${new Date(
                        trialEndsAt!
                      ).toLocaleDateString()}. Upgrade now to keep access to all features.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Info */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Plan</span>
            <span className="text-sm text-muted-foreground">
              {tierInfo[subscriptionTier].description}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Quota</span>
            <span className="text-sm text-muted-foreground">
              {tierInfo[subscriptionTier].quota}
            </span>
          </div>

          {subscriptionTier !== "demo" && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usage This Month</span>
              <span className="text-sm">
                <span
                  className={
                    uploadsUsed >= uploadQuota
                      ? "text-red-600 font-semibold"
                      : "text-muted-foreground"
                  }
                >
                  {uploadsUsed}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  / {uploadQuota} projects
                </span>
              </span>
            </div>
          )}

          {/* Usage Progress Bar */}
          {subscriptionTier !== "demo" && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    uploadsUsed >= uploadQuota
                      ? "bg-red-500"
                      : uploadsUsed >= uploadQuota * 0.8
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (uploadsUsed / uploadQuota) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {Math.round((uploadsUsed / uploadQuota) * 100)}% used
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscriptionTier === "demo" ? (
            <Button onClick={handleUpgrade} className="flex-1" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              {isTrialExpired ? "Upgrade Now" : "Upgrade to PRO"}
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
        {subscriptionTier !== "demo" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p>
              💳 In the billing portal, you can update payment method, view
              invoices, and manage your subscription.
            </p>
          </div>
        )}

        {/* Quota Warning */}
        {uploadsUsed >= uploadQuota && subscriptionTier !== "demo" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Quota Limit Reached</p>
              <p className="text-xs mt-1">
                You've reached your monthly upload limit.
                {subscriptionTier === "pro"
                  ? " Upgrade to PRO+ for 30 projects/month or wait until next billing cycle."
                  : " Your quota will reset at the start of next billing cycle."}
              </p>
            </div>
          </div>
        )}

        {/* Trial Expiring Warning */}
        {subscriptionTier === "demo" &&
          daysRemaining <= 3 &&
          daysRemaining > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Trial Ending Soon</p>
                <p className="text-xs mt-1">
                  Your trial ends in {daysRemaining} days. Upgrade now to avoid
                  interruption.
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
              be downgraded to the Demo plan.
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
