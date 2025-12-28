// src/components/AuthWrapper.tsx - FIXED VERSION
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Redirect ke auth jika TIDAK ADA USER dan tidak loading
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // ✅ Show loading saat masih checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg text-muted-foreground">Memuat...</span>
      </div>
    );
  }

  // ✅ Jika belum login, jangan render children (akan redirect)
  if (!user) {
    return null;
  }

  // ✅ Render children hanya untuk authenticated user
  return <>{children}</>;
};
