import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title = "Dashboard" }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "ml-20" : "ml-[280px]"
        )}
      >
        <Header title={title} />
        <main className="flex-1 p-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="py-4 px-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings.brand_footer_text || "Vibrantick Infotech Solutions"}. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
