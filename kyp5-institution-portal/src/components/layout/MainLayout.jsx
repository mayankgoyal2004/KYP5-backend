import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

export function MainLayout({ children, title = "Dashboard" }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="py-4 px-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KYP-5 Institutional Career Assessment Platform. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
