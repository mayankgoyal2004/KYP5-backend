import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  GraduationCap,
  CreditCard,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTenantAuth } from "../../contexts/TenantAuthContext";
import { useTenantDashboardQuery } from "../../hooks/useTenantData";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, institution, logout } = useTenantAuth();
  const { data: dashboardData } = useTenantDashboardQuery();
  const location = useLocation();
  const pathname = location.pathname;

  const instName = dashboardData?.institution?.name || institution?.name || "Institution";
  const planBadge = dashboardData?.subscription?.planName || institution?.planName || "STANDARD PLAN";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Student Directory", icon: Users, href: "/students" },
    { label: "Student Counseling", icon: GraduationCap, href: "/counseling" },
    { label: "Staff & Counselors", icon: UserPlus, href: "/staff" },
    { label: "Subscription & Billing", icon: CreditCard, href: "/billing" },
  ];

  const renderNavItem = (item) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    const content = (
      <div
        className={cn(
          "flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative mx-1",
          isActive
            ? "bg-white/15 text-white font-bold shadow-sm"
            : "text-white/80 hover:bg-white/8 hover:text-white font-medium"
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 min-w-5 transition-colors",
            isActive ? "text-white" : "text-white/80 group-hover:text-white"
          )}
        />
        {!collapsed && (
          <span className="truncate text-sm tracking-wide text-white">
            {item.label}
          </span>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link to={item.href}>{content}</Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={14}
            className="ml-1 border-white/10 bg-[#1b3a88] text-xs font-bold text-white shadow-xl"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link key={item.href} to={item.href}>
        {content}
      </Link>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="h-screen bg-sidebar text-white border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 shadow-2xl"
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-transparent">
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="rounded-xl bg-gradient-to-tr from-[#13538A] to-blue-400 p-2 flex-shrink-0 text-white font-extrabold text-sm shadow-md border border-white/20">
                K5
              </div>
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-sm font-extrabold leading-tight text-white">
                  {instName}
                </h1>
                <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/70">
                  Institution Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#13538A] to-blue-400 text-white font-bold flex items-center justify-center text-sm shadow-md border border-white/20">
                K5
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-white hover:bg-white/15 h-8 w-8 rounded-lg",
              collapsed && "hidden"
            )}
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto sidebar-scroll py-4 px-2 space-y-1">
          <div className="mt-1 mb-2 px-3">
            {!collapsed ? (
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                Management Modules
              </p>
            ) : (
              <div className="mx-2 border-t border-white/10" />
            )}
          </div>
          {navItems.map(renderNavItem)}
        </div>

        {/* Expand Button (when collapsed) */}
        {collapsed && (
          <div className="p-2 flex justify-center border-t border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="text-white/80 hover:bg-white/10 hover:text-white h-8 w-8 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* User / Institution Profile Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="h-9 w-9 border border-white/20 shadow-sm">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-white/20 font-bold text-white text-xs">
                {(user?.name || "Admin").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-extrabold text-white">
                  {user?.name || "School Admin"}
                </p>
                <p className="truncate text-[10px] font-semibold text-white/70">
                  {user?.email || "admin@school.edu"}
                </p>
              </div>
            )}

            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg"
                onClick={() => logout()}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
