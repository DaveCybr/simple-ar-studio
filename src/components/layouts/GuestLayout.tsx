// src/components/layouts/GuestLayout.tsx
import { ReactNode } from "react";
import { Navbar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

interface GuestLayoutProps {
  children: ReactNode;
  navbarVariant?: "default" | "transparent";
  showFooter?: boolean;
}

export const GuestLayout = ({
  children,
  navbarVariant = "transparent",
  showFooter = true,
}: GuestLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar variant={navbarVariant} />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};
