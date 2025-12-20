import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ARProjectForm } from "@/components/ARProjectForm";
import { ARProjectList } from "@/components/ARProjectList";
import { 
  Scan, 
  Upload, 
  Layers, 
  LogOut, 
  User,
  Crown,
  Loader2
} from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  upload_quota: number;
  uploads_used: number;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setProfile(data);
      }
      setProfileLoading(false);
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSelectProject = (projectId: string) => {
    navigate(`/view/${projectId}`);
  };

  const handleUploadSuccess = async () => {
    setRefreshKey((prev) => prev + 1);
    
    // Update uploads_used
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ uploads_used: profile.uploads_used + 1 })
        .eq('id', profile.id);
      
      if (!error) {
        setProfile({ ...profile, uploads_used: profile.uploads_used + 1 });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tierLabels = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  const tierMarkerLimits = {
    free: 3,
    pro: 5,
    enterprise: 5,
  };

  const canUpload = profile ? profile.uploads_used < profile.upload_quota || profile.subscription_tier === 'enterprise' : false;
  const uploadProgress = profile ? (profile.uploads_used / profile.upload_quota) * 100 : 0;
  const maxMarkers = tierMarkerLimits[profile?.subscription_tier || 'free'];

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
            <div className="flex items-center gap-2">
              <Badge variant={profile?.subscription_tier === 'free' ? 'secondary' : 'default'}>
                {profile?.subscription_tier === 'enterprise' && <Crown className="w-3 h-3 mr-1" />}
                {tierLabels[profile?.subscription_tier || 'free']}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{profile?.email || user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Quota Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Kuota Project</CardTitle>
                <CardDescription>
                  {profile?.subscription_tier === 'enterprise' 
                    ? 'Unlimited project' 
                    : `${profile?.uploads_used || 0} dari ${profile?.upload_quota || 3} project digunakan`
                  }
                  <span className="ml-2 text-xs">
                    (Maks {maxMarkers} marker per project)
                  </span>
                </CardDescription>
              </div>
              {profile?.subscription_tier !== 'enterprise' && (
                <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                  Upgrade
                </Button>
              )}
            </div>
          </CardHeader>
          {profile?.subscription_tier !== 'enterprise' && (
            <CardContent>
              <Progress value={uploadProgress} className="h-2" />
            </CardContent>
          )}
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Project AR
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2" disabled={!canUpload}>
              <Upload className="w-4 h-4" />
              Buat Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ARProjectList onSelectProject={handleSelectProject} refresh={refreshKey} />
          </TabsContent>

          <TabsContent value="upload" className="flex justify-center">
            {canUpload ? (
              <ARProjectForm onSuccess={handleUploadSuccess} maxMarkers={maxMarkers} />
            ) : (
              <Card className="max-w-md">
                <CardContent className="p-8 text-center">
                  <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
                    <Upload className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Kuota Habis</h3>
                  <p className="text-muted-foreground mb-4">
                    Anda telah menggunakan semua kuota project bulan ini.
                  </p>
                  <Button onClick={() => navigate('/pricing')}>
                    Upgrade Sekarang
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
