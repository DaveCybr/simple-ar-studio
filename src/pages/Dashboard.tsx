// src/pages/Dashboard.tsx - FIXED VERSION
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ARProjectList } from "@/components/ARProjectList";
import {
  Scan,
  Upload,
  Layers,
  LogOut,
  Crown,
  Loader2,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { ARProjectForm } from "@/components/ARProjectForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { BillingSettings } from "@/components/BillingSetting";
import { useToast } from "@/hooks/use-toast";

// ✅ FIXED: Interface dengan tipe yang benar
interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "demo" | "pro" | "pro_plus"; // ✅ Fixed tipe
  upload_quota: number;
  uploads_used: number;
  stripe_customer_id: string | null;
  trial_ends_at?: string | null; // ✅ Added
  is_trial_active?: boolean; // ✅ Added
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Gagal memuat profil. Silakan refresh halaman.",
          variant: "destructive",
        });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  // ✅ Handle payment success/cancel redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated.",
      });

      // Remove query params
      window.history.replaceState({}, "", "/dashboard");

      // Refresh profile after short delay
      setTimeout(() => {
        if (user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
              if (data) setProfile(data);
            });
        }
      }, 2000);
    }

    if (canceled === "true") {
      toast({
        title: "Payment Canceled",
        description: "You can upgrade anytime from the pricing page.",
        variant: "default",
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, user, toast]);

  const handleSelectProject = (projectId: string) => {
    navigate(`/view/${projectId}`);
  };

  const handleUploadSuccess = async () => {
    setRefreshKey((prev) => prev + 1);

    // Update uploads_used
    if (profile) {
      const { error } = await supabase
        .from("profiles")
        .update({ uploads_used: profile.uploads_used + 1 })
        .eq("id", profile.id);

      if (!error) {
        setProfile({ ...profile, uploads_used: profile.uploads_used + 1 });
      }
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Gagal logout. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ✅ Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ FIXED: Tier labels yang konsisten
  const tierLabels: Record<"demo" | "pro" | "pro_plus", string> = {
    demo: "Demo Trial",
    pro: "PRO",
    pro_plus: "PRO+",
  };

  // ✅ FIXED: Marker limits yang benar
  const tierMarkerLimits: Record<"demo" | "pro" | "pro_plus", number> = {
    demo: 5,
    pro: 5,
    pro_plus: 5,
  };

  // ✅ Calculate if user can upload
  const canUpload = profile
    ? profile.uploads_used < profile.upload_quota ||
      profile.subscription_tier === "demo" // Demo unlimited during trial
    : false;

  const uploadProgress = profile
    ? Math.min((profile.uploads_used / profile.upload_quota) * 100, 100)
    : 0;

  const maxMarkers = profile ? tierMarkerLimits[profile.subscription_tier] : 5;

  // ✅ Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!profile?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialExpired =
    profile?.subscription_tier === "demo" && trialDaysRemaining <= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Scan className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">AR Manager</span>
          </div>

          <div className="flex items-center gap-4">
            {/* ✅ FIXED: Badge dengan kondisi yang benar */}
            <Badge
              variant={
                profile?.subscription_tier === "demo" ? "secondary" : "default"
              }
              className={
                profile?.subscription_tier === "pro_plus"
                  ? "bg-purple-600"
                  : profile?.subscription_tier === "pro"
                  ? "bg-blue-600"
                  : ""
              }
            >
              {profile?.subscription_tier === "pro_plus" && (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              {profile?.subscription_tier === "pro" && (
                <Crown className="w-3 h-3 mr-1" />
              )}
              {profile ? tierLabels[profile.subscription_tier] : "Loading..."}
            </Badge>

            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={profile?.avatar_url || undefined}
                  alt={profile?.full_name || profile?.email || "User"}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(profile?.full_name || profile?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:block text-sm">
                <p className="font-medium">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.email || user?.email}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Ya, Logout
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* ✅ Trial Warning Banner */}
        {profile?.subscription_tier === "demo" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {isTrialExpired
                      ? "Trial Expired"
                      : `${trialDaysRemaining} Days Left in Trial`}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {isTrialExpired
                      ? "Upgrade now to continue using premium features"
                      : `Your trial ends on ${new Date(
                          profile.trial_ends_at!
                        ).toLocaleDateString()}`}
                  </p>
                </div>
                <Button onClick={() => navigate("/pricing")} size="sm">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quota Card */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Kuota Project</CardTitle>
                <CardDescription>
                  {profile?.subscription_tier === "demo"
                    ? `Unlimited during trial (${trialDaysRemaining} days left)`
                    : `${profile?.uploads_used || 0} dari ${
                        profile?.upload_quota || 3
                      } project digunakan`}
                  <span className="ml-2 text-xs">
                    (Maks {maxMarkers} marker per project)
                  </span>
                </CardDescription>
              </div>
              {profile?.subscription_tier !== "pro_plus" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/pricing")}
                >
                  {profile?.subscription_tier === "demo"
                    ? "Upgrade"
                    : "Upgrade to PRO+"}
                </Button>
              )}
            </div>
          </CardHeader>
          {profile?.subscription_tier !== "demo" && (
            <CardContent>
              <Progress value={uploadProgress} className="h-2" />
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Project AR
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex items-center gap-2"
              disabled={!canUpload || isTrialExpired}
            >
              <Upload className="w-4 h-4" />
              Buat Project
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ARProjectList
              onSelectProject={handleSelectProject}
              refresh={refreshKey}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex justify-center">
            {canUpload && !isTrialExpired ? (
              <ARProjectForm
                onSuccess={handleUploadSuccess}
                maxMarkers={maxMarkers}
              />
            ) : (
              <Card className="max-w-md">
                <CardContent className="p-8 text-center">
                  <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
                    <Upload className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {isTrialExpired ? "Trial Expired" : "Kuota Habis"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isTrialExpired
                      ? "Your trial has ended. Upgrade to continue creating AR projects."
                      : "Anda telah menggunakan semua kuota project bulan ini."}
                  </p>
                  <Button onClick={() => navigate("/pricing")}>
                    Upgrade Sekarang
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ✅ BILLING TAB - FIXED with correct props */}
          <TabsContent value="billing" className="flex justify-center">
            <div className="w-full max-w-2xl">
              {profile ? (
                <BillingSettings
                  subscriptionTier={profile.subscription_tier}
                  uploadQuota={profile.upload_quota}
                  uploadsUsed={profile.uploads_used}
                  stripeCustomerId={profile.stripe_customer_id}
                  trialEndsAt={profile.trial_ends_at}
                  isTrialActive={profile.is_trial_active}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Memuat informasi billing...
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
