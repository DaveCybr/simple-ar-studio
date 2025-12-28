import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users to auth page
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg text-muted-foreground">Memuat...</span>
      </div>
    );
  }
  return <>{children}</>;
};
