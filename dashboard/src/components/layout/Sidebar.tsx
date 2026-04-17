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
  CalendarDays,
  MonitorUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/contexts/SettingsContext";
import { getImageUrl } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, logout, canAny } = useAuth();
  const { settings, isLoading } = useSystemSettings();
  const location = useLocation();
  const pathname = location.pathname;
  const logoUrl = settings.brand_logo_url
    ? getImageUrl(settings.brand_logo_url)
    : "";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

    {
      label: "Course Categories",
      icon: FolderOpen,
      href: "/course-categories",
      module: "courses",
    },
    {
      label: "Courses",
      icon: BookOpen,
      href: "/courses",
      module: "courses",
    },

    {
      label: "Tests",
      icon: ClipboardCheck,
      href: "/tests",
      module: "tests",
    },
    // {
    //   label: "Questions",
    //   icon: HelpCircle,
    //   href: "/questions",
    //   module: "questions",
    // },
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
  const filteredAdminItems = filterItems(adminItems);
  const filteredSettingsItems = filterItems(bottomItems);

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link key={item.href} to={item.href}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative",
            isActive
              ? "bg-primary text-primary-foreground font-medium shadow-md"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5 min-w-5",
              isActive ? "text-white" : "group-hover:text-primary",
            )}
          />
          {!collapsed && <span className="truncate text-sm">{item.label}</span>}
          {collapsed && (
            <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
              {item.label}
            </div>
          )}
        </div>
      </Link>
    );
  };

  const renderSection = (title: string, items: typeof navItems) => {
    if (items.length === 0) return null;
    return (
      <>
        <div className="mt-6 mb-2 px-3">
          {!collapsed ? (
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
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
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 shadow-xl",
        collapsed ? "w-20" : "w-[280px]",
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center overflow-hidden">
            {logoUrl ? (
              <div className="h-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : isLoading ? (
              <div className="h-10 w-28 rounded-md bg-sidebar-accent/60 animate-pulse" />
            ) : (
              <div className="bg-primary/20 p-1.5 rounded-lg flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            {logoUrl ? (
              <div className="h-8 w-8 flex items-center justify-center">
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
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "hidden",
          )}
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredNavItems.map(renderNavItem)}
        {renderSection("Content Management", filteredCmsItems)}
        {renderSection("Administration", filteredAdminItems)}
        {renderSection("", filteredSettingsItems)}
      </div>

      {/* Expand Button (when collapsed) */}
      {collapsed && (
        <div className="p-2 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/10">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="h-9 w-9 border border-sidebar-border shadow-sm">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tight">
                {user?.role?.name?.replace("_", " ")}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
