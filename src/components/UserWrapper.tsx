// src/components/UserWrapper.tsx - FIXED VERSION
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserWrapperProps {
  children: ReactNode;
}

export const UserWrapper = ({ children }: UserWrapperProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Hanya redirect jika user SUDAH LOGIN dan tidak loading
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
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

  // ✅ Jika user sudah login, jangan render children (akan redirect)
  if (user) {
    return null;
  }

  // ✅ Render children hanya untuk guest (user belum login)
  return <>{children}</>;
};
