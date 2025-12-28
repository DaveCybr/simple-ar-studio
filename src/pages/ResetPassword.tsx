// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scan, Loader2, Lock } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string().min(6, "Password minimal 6 karakter");

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if user came from password reset email
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Link Tidak Valid",
          description: "Link reset password sudah kadaluarsa atau tidak valid",
          variant: "destructive",
        });
        setTimeout(() => navigate("/auth"), 2000);
      }
    });
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak sama",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Reset Password Gagal",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Berhasil",
        description: "Password Anda telah diubah!",
      });

      // Sign out user and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth"), 1500);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memverifikasi link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />

      <Card className="w-full max-w-md relative z-10 shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit">
            <Scan className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Masukkan password baru Anda</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ganti Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
