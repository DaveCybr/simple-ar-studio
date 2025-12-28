import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import ViewAR from "./pages/ViewAR";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword"; // ✅ TAMBAHKAN INI
import { UserWrapper } from "./components/UserWrapper";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <UserWrapper>
          <Landing />
        </UserWrapper>
      }
    />
    <Route
      path="/pricing"
      element={
        <UserWrapper>
          <Pricing />
        </UserWrapper>
      }
    />
    <Route path="/auth" element={<Auth />} />

    {/* ✅ TAMBAHKAN ROUTE INI */}
    <Route path="/reset-password" element={<ResetPassword />} />

    <Route
      path="/dashboard"
      element={
        <AuthWrapper>
          <Dashboard />
        </AuthWrapper>
      }
    />

    <Route path="/view/:id" element={<ViewAR />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
