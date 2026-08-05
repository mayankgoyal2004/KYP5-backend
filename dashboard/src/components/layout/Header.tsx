import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sun,
  Moon,
  Bell,
  Settings,
  User,
  Key,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  FileText,
  FolderTree,
  Quote,
  Handshake,
  BriefcaseBusiness,
  MonitorUp,
  Trophy,
  Images,
  CalendarDays,
  UserSquare2,
  MessageSquare,
  MailPlus,
  Shield,
  Users,
  Trash2,
  GitBranch,
  GitMerge,
  ListOrdered,
  Building2,
  HelpCircle,
  BookOpen,
  Tags,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {  Navigate } from "react-router-dom";

import { Link, useNavigate } from "react-router-dom";
export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  const { user, logout, canAny } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const modules = [
    { label: "Dashboard", href: "/dashboard", category: "Main Menu", icon: LayoutDashboard },
    { label: "Tests", href: "/tests", category: "Main Menu", icon: ClipboardCheck },
    { label: "Students", href: "/students", category: "Main Menu", icon: GraduationCap },
    { label: "Results", href: "/results", category: "Main Menu", icon: BarChart3 },
    { label: "Assessment Groups", href: "/assessment-groups", category: "Assessment Management", icon: GitBranch },
    { label: "Assessment Sub-Groups", href: "/assessment-sub-groups", category: "Assessment Management", icon: GitMerge },
    { label: "Option Scores", href: "/assessment-option-scores", category: "Assessment Management", icon: ListOrdered },
    { label: "Report Templates", href: "/report-templates", category: "Assessment Management", icon: FileText },
    { label: "Institutions", href: "/institutions", category: "Assessment Management", icon: Building2 },
    { label: "Blogs", href: "/blogs", category: "Content Management", icon: FileText },
    { label: "Blogs Category", href: "/blog-categories", category: "Content Management", icon: FolderTree },
    { label: "Testimonials", href: "/testimonials", category: "Content Management", icon: Quote },
    { label: "Partners", href: "/partners", category: "Content Management", icon: Handshake },
    { label: "Services", href: "/services", category: "Content Management", icon: BriefcaseBusiness },
    { label: "Website Hero", href: "/website-hero", category: "Content Management", icon: MonitorUp },
    { label: "About Us", href: "/about-us", category: "Content Management", icon: FileText },
    { label: "Why Choose Us Cards", href: "/why-choose-us", category: "Content Management", icon: BookOpen },
    { label: "Why Choose Us (Homepage)", href: "/why-choose-us-homepage", category: "Content Management", icon: BookOpen },
    { label: "Help Center", href: "/help-center", category: "Content Management", icon: HelpCircle },
    { label: "Pricing Plans", href: "/pricing-plans", category: "Content Management", icon: Tags },
    { label: "Counters", href: "/counters", category: "Content Management", icon: Trophy },
    { label: "Gallery", href: "/gallery", category: "Content Management", icon: Images },
    { label: "Events", href: "/events", category: "Content Management", icon: CalendarDays },
    { label: "Team", href: "/team", category: "Content Management", icon: UserSquare2 },
    { label: "Contact Messages", href: "/contacts", category: "Content Management", icon: MessageSquare },
    { label: "Newsletter", href: "/newsletter", category: "Content Management", icon: MailPlus },
    { label: "Privacy Policy", href: "/privacy-policy", category: "Content Management", icon: Shield },
    { label: "Terms & Conditions", href: "/terms-conditions", category: "Content Management", icon: FileText },
    { label: "User Management", href: "/users", category: "Administration", icon: Users },
    { label: "Roles & Permissions", href: "/permissions", category: "Administration", icon: Shield },
    { label: "Settings", href: "/settings", category: "System", icon: Settings },
    { label: "Recycle Bin", href: "/recycle-bin", category: "System", icon: Trash2 },
  ];

  // Filter modules based on user access
  const allowedModules = modules.filter(m => {
    const moduleMap: Record<string, string> = {
      "/tests": "tests",
      "/students": "students",
      "/results": "tests",
      "/blogs": "blogs",
      "/blog-categories": "blog_categories",
      "/testimonials": "testimonials",
      "/partners": "partners",
      "/services": "services",
      "/website-hero": "settings",
      "/about-us": "settings",
      "/why-choose-us": "why_choose",
      "/why-choose-us-homepage": "settings",
      "/help-center": "help_center",
      "/pricing-plans": "pricing",
      "/counters": "counters",
      "/gallery": "gallery",
      "/events": "events",
      "/team": "teams",
      "/contacts": "contacts",
      "/newsletter": "newsletter",
      "/users": "users",
      "/permissions": "users",
      "/assessment-groups": "assessment-groups",
      "/assessment-sub-groups": "assessment-sub-groups",
      "/assessment-option-scores": "assessment-option-scores",
      "/report-templates": "report-templates",
      "/institutions": "institutions",
      "/settings": "settings",
      "/recycle-bin": "recycle_bin",
    };

    const reqModule = moduleMap[m.href];
    if (!reqModule) return true;
    return canAny(reqModule) || user?.role?.name === "SUPER_ADMIN";
  });

  // Filter based on query
  const filteredResults = searchQuery
    ? allowedModules.filter(m =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleResultClick = (href: string) => {
    navigate(href);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div ref={searchRef} className="hidden md:flex w-full max-w-md relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="h-10 rounded-full border-border/60 bg-muted/40 pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-sm font-medium"
            />
          </div>

          {/* Results Dropdown */}
          {isOpen && searchQuery && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 overflow-hidden py-2 max-h-[300px] overflow-y-auto sidebar-scroll">
              <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Matching Modules ({filteredResults.length})
              </div>
              {filteredResults.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                  No modules found
                </div>
              ) : (
                filteredResults.map((res) => {
                  const IconComp = res.icon;
                  return (
                    <div
                      key={res.href}
                      onClick={() => handleResultClick(res.href)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition text-slate-700 dark:text-slate-200"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-none mb-0.5 text-slate-700 dark:text-slate-200">
                          {res.label}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {res.category}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button
            onClick={() => navigate("/settings")}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Divider */}
          <div className="mx-2 h-6 w-px bg-border" />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-full px-2 hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback>
                    {user?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <Link to="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>

              <Link to="/change-password">
                <DropdownMenuItem>
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
