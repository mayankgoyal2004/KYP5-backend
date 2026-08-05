import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Users,
  GraduationCap,
  FolderOpen,
  Images,
  FileText,
  FolderTree,
  Handshake,
  Trophy,
  UsersRound,
  UserSquare2,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Quote,
  MessageSquare,
  MailPlus,
  Globe,
  Trash2,
  Settings,
  HelpCircle,
  Tags,
  CalendarDays,
  MonitorUp,
  BriefcaseBusiness,
  GitBranch,
  GitMerge,
  ListOrdered,
  Lightbulb,
  Layers,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, logout, canAny } = useAuth();
  const { settings, isLoading } = useSystemSettings();
  const { theme } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;

  const getLogo = () => {
    if (theme === "dark" && settings.brand_logo_dark_url) {
      return getImageUrl(settings.brand_logo_dark_url);
    }
    return settings.brand_logo_url ? getImageUrl(settings.brand_logo_url) : "";
  };

  const logoUrl = getLogo();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

    {
      label: "Tests",
      icon: ClipboardCheck,
      href: "/tests",
      module: "tests",
    },
    {
      label: "Students",
      icon: GraduationCap,
      href: "/students",
      module: "students",
    },
    {
      label: "Results",
      icon: BarChart3,
      href: "/results",
      module: "tests",
    },
  ];

  const cmsItems = [
    {
      label: "Blogs",
      icon: FileText,
      href: "/blogs",
      module: "blogs",
    },
    {
      label: "Blogs Category",
      icon: FolderTree,
      href: "/blog-categories",
      module: "blog_categories",
    },
    {
      label: "Testimonials",
      icon: Quote,
      href: "/testimonials",
      module: "testimonials",
    },
    {
      label: "Partners",
      icon: Handshake,
      href: "/partners",
      module: "partners",
    },
    {
      label: "Services",
      icon: BriefcaseBusiness,
      href: "/services",
      module: "services",
    },
    {
      label: "Help Center",
      icon: HelpCircle,
      href: "/help-center",
      module: "help_center",
    },
    {
      label: "Website Hero",
      icon: MonitorUp,
      href: "/website-hero",
      module: "settings",
    },
    {
      label: "About Us",
      icon: FileText,
      href: "/about-us",
      module: "settings",
    },
    {
      label: "Why Choose Us Cards",
      icon: BookOpen,
      href: "/why-choose-us",
      module: "why_choose",
    },
    {
      label: "Why Choose Us (Homepage)",
      icon: BookOpen,
      href: "/why-choose-us-homepage",
      module: "settings",
    },
    {
      label: "Pricing Plans",
      icon: Tags,
      href: "/pricing-plans",
      module: "pricing",
    },
    {
      label: "Counters",
      icon: Trophy,
      href: "/counters",
      module: "counters",
    },
    {
      label: "Gallery",
      icon: Images,
      href: "/gallery",
      module: "gallery",
    },
    {
      label: "Events",
      icon: CalendarDays,
      href: "/events",
      module: "events",
    },
    {
      label: "Team",
      icon: UserSquare2,
      href: "/team",
      module: "teams",
    },
    {
      label: "Contact Messages",
      icon: MessageSquare,
      href: "/contacts",
      module: "contacts",
    },
    {
      label: "Newsletter",
      icon: MailPlus,
      href: "/newsletter",
      module: "newsletter",
    },
    {
      label: "Privacy Policy",
      icon: Shield,
      href: "/privacy-policy",
    },
    {
      label: "Terms & Conditions",
      icon: FileText,
      href: "/terms-conditions",
    },
    // {
    //   label: "Languages",
    //   icon: Globe,
    //   href: "/languages",
    //   module: "languages",
    // },
  ];

  const adminItems = [
    { label: "User Management", icon: Users, href: "/users", module: "users" },
    {
      label: "Roles & Permissions",
      icon: Shield,
      href: "/permissions",
      module: "users",
    },
    // {
    //   label: "Recycle Bin",
    //   icon: Trash2,
    //   href: "/recycle-bin",
    //   module: "recycle_bin",
    // },
  ];

  const assessmentItems = [
    {
      label: "Assessment Groups",
      icon: GitBranch,
      href: "/assessment-groups",
      module: "assessment-groups",
    },
    {
      label: "Assessment Sub-Groups",
      icon: GitMerge,
      href: "/assessment-sub-groups",
      module: "assessment-sub-groups",
    },
    {
      label: "Option Scores",
      icon: ListOrdered,
      href: "/assessment-option-scores",
      module: "assessment-option-scores",
    },

    {
      label: "Report Templates",
      icon: FileText,
      href: "/report-templates",
      module: "report-templates",
    },
    {
      label: "Institutions",
      icon: Building2,
      href: "/institutions",
      module: "institutions",
    },
  ];

  const filterItems = (items: typeof navItems) =>
    items.filter(
      (item) =>
        !item.module ||
        canAny(item.module) ||
        user?.role?.name === "SUPER_ADMIN",
    );

  const bottomItems = [
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      module: "settings",
    },
    // {
    //   label: "Audit Logs",
    //   icon: Shield,
    //   href: "/audit-logs",
    //   module: "audit_logs",
    // },
    {
      label: "Recycle Bin",
      icon: Trash2,
      href: "/recycle-bin",
      module: "recycle_bin",
    },
  ].filter(
    (item) =>
      !item.module || canAny(item.module) || user?.role?.name === "SUPER_ADMIN",
  );

  const filteredNavItems = filterItems(navItems);
  const filteredCmsItems = filterItems(cmsItems);
  const filteredAssessmentItems = filterItems(assessmentItems);
  const filteredAdminItems = filterItems(adminItems);
  const filteredSettingsItems = filterItems(bottomItems);

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const content = (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative mx-1",
          isActive
            ? "bg-white/12 text-white font-medium shadow-sm"
            : "text-white hover:bg-white/5 font-medium",
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 min-w-5 transition-colors",
            isActive ? "text-white" : "text-white group-hover:text-white",
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

  const renderSection = (title: string, items: typeof navItems) => {
    if (items.length === 0) return null;
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
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-transparent">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            {logoUrl ? (
              <div className="h-10 max-w-[160px] flex-shrink-0 flex items-center justify-start">
                <img
                  src={logoUrl}
                  alt="Logo"
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
                    {settings.org_name || "Dashboard"}
                  </h1>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/70">
                    {settings.org_short_name || "Admin Portal"}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            {logoUrl ? (
              <div className="h-8 max-w-[50px] flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : isLoading ? (
              <div className="h-8 w-8 rounded-md bg-sidebar-accent/60 animate-pulse" />
            ) : (
              <GraduationCap className="h-8 w-8 text-primary" />
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-white hover:bg-white/15",
            collapsed && "hidden",
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
        {filteredNavItems.map(renderNavItem)}
        {renderSection("Assessment Management", filteredAssessmentItems)}
        {renderSection("Content Management", filteredCmsItems)}
        {renderSection("Administration", filteredAdminItems)}
        <div className="my-4 mx-2 border-t border-white/10" />
        {filteredSettingsItems.map(renderNavItem)}
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

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="h-9 w-9 border border-white/20 shadow-sm">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="bg-white/20 font-bold text-white">
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-extrabold text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs font-semibold text-white/70">
                {user?.role?.name?.replace("_", " ")}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:bg-rose-500/20 hover:text-rose-300"
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
