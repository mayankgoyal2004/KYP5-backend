import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn, getImageUrl } from "../../lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  UsersRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTenantAuth } from "../../contexts/TenantAuthContext";
import { useTenantDashboardQuery } from "../../hooks/useTenantData";
import { useSystemSettings } from "../../contexts/SettingsContext";
import { useTheme } from "next-themes";
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
  const { settings, isLoading } = useSystemSettings();
  const { theme } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;

  // Platform branding logo for top sidebar header ONLY
  const brandLogoUrl =
    theme === "dark" && settings.brand_logo_dark_url
      ? getImageUrl(settings.brand_logo_dark_url)
      : settings.brand_logo_url
      ? getImageUrl(settings.brand_logo_url)
      : "";

  // Institution logo to display in place of profile avatar
  const institutionLogoUrl =
    dashboardData?.institution?.logoUrl || institution?.logoUrl;
  const profileAvatarUrl = institutionLogoUrl
    ? getImageUrl(institutionLogoUrl)
    : user?.avatarUrl
    ? getImageUrl(user.avatarUrl)
    : "";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  ];

  const assessmentItems = [
    { label: "Student Directory", icon: Users, href: "/students" },
    { label: "Student Counseling", icon: GraduationCap, href: "/counseling" },
  ];

  const adminItems = [
    { label: "Staff & Counselors", icon: UsersRound, href: "/staff" },
    { label: "Subscription & Seats", icon: CreditCard, href: "/billing" },
  ];

  const bottomItems = [
    { label: "Institution Profile", icon: Building2, href: "/profile" },
  ];

  const renderNavItem = (item) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    const content = (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative mx-1",
          isActive
            ? "bg-white/12 text-white font-medium shadow-sm"
            : "text-white hover:bg-white/5 font-medium"
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 min-w-5 transition-colors",
            isActive ? "text-white" : "text-white group-hover:text-white"
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
            className="ml-1 border-white/10 bg-[#1b3a88] text-xs font-bold text-white"
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

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <>
        <div className="mt-6 mb-2 px-3">
          {!collapsed ? (
            <p className="text-[10px] uppercase font-bold text-white/45 tracking-widest">
              {title}
            </p>
          ) : (
            <div className="border-t border-sidebar-border/50 mx-2" />
          )}
        </div>
        {items.map(renderNavItem)}
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="h-screen bg-sidebar text-white border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 shadow-2xl"
      >
        {/* Header - BRANDING LOGO ONLY */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-transparent">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              {brandLogoUrl ? (
                <div className="h-10 max-w-[160px] flex-shrink-0 flex items-center justify-start">
                  <img
                    src={brandLogoUrl}
                    alt={settings.org_name || "KYP-5 Logo"}
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : isLoading ? (
                <div className="h-10 w-28 rounded-md bg-sidebar-accent/60 animate-pulse" />
              ) : (
                <>
                  <div className="rounded-lg bg-white/15 p-1.5 flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h1 className="truncate text-sm font-extrabold leading-tight text-white">
                      {settings.org_name || "KYP-5"}
                    </h1>
                    <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/70">
                      {settings.org_short_name || "Institution Portal"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              {brandLogoUrl ? (
                <div className="h-8 max-w-[50px] flex items-center justify-center">
                  <img
                    src={brandLogoUrl}
                    alt="Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : isLoading ? (
                <div className="h-8 w-8 rounded-md bg-sidebar-accent/60 animate-pulse" />
              ) : (
                <GraduationCap className="h-8 w-8 text-white" />
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-white hover:bg-white/15",
              collapsed && "hidden"
            )}
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto sidebar-scroll py-4 px-2 space-y-1">
          <div className="mt-2 mb-2 px-3">
            {!collapsed ? (
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                Menu
              </p>
            ) : (
              <div className="mx-2 border-t border-white/10" />
            )}
          </div>
          {navItems.map(renderNavItem)}
          {renderSection("Academic Management", assessmentItems)}
          {renderSection("Administration", adminItems)}
          <div className="my-4 mx-2 border-t border-white/10" />
          {bottomItems.map(renderNavItem)}
        </div>

        {/* Expand Button (when collapsed) */}
        {collapsed && (
          <div className="p-2 flex justify-center border-t border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* User Profile Card - INSTITUTION LOGO IN PLACE OF PROFILE IMAGE */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="h-9 w-9 border border-white/20 shadow-sm bg-white/10 shrink-0">
              <AvatarImage
                src={profileAvatarUrl}
                alt="Profile"
                className="object-contain p-0.5"
              />
              <AvatarFallback className="bg-white/20 font-bold text-white text-xs">
                {(institution?.name || user?.name || "Admin").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-extrabold text-white">
                  {user?.name || institution?.name || "School Administrator"}
                </p>
                <p className="truncate text-xs font-semibold text-white/70 uppercase">
                  {user?.role?.name ? user.role.name.replace("_", " ") : "SCHOOL ADMIN"}
                </p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:bg-rose-500/20 hover:text-rose-300 shrink-0"
                onClick={() => logout()}
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
