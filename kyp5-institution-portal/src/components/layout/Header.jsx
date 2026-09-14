import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Search,
  Sun,
  Moon,
  Building2,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Users,
  Sparkles,
  GraduationCap,
  CreditCard,
  UserPlus,
  Key,
  Copy,
} from "lucide-react";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useTenantAuth } from "../../contexts/TenantAuthContext";
import { useTenantDashboardQuery } from "../../hooks/useTenantData";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";

export function Header({ title }) {
  const { theme, setTheme } = useTheme();
  const { user, institution, logout } = useTenantAuth();
  const { data: dashboardData } = useTenantDashboardQuery();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const modules = [
    { label: "Dashboard", href: "/", category: "Main Menu", icon: LayoutDashboard },
    { label: "Student Directory", href: "/students", category: "Academics", icon: Users },
    { label: "Assessment Campaigns", href: "/campaigns", category: "Assessments", icon: Sparkles },
    { label: "Student Counseling", href: "/counseling", category: "Guidance", icon: GraduationCap },
    { label: "Staff & Counselors", href: "/staff", category: "Administration", icon: UserPlus },
    { label: "Subscription & Billing", href: "/billing", category: "Account", icon: CreditCard },
  ];

  const filteredResults = searchQuery
    ? modules.filter(
        (m) =>
          m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleResultClick = (href) => {
    navigate(href);
    setSearchQuery("");
    setIsOpen(false);
  };

  const instName = dashboardData?.institution?.name || institution?.name || "Institution";
  const planBadge = dashboardData?.subscription?.planName || institution?.planName || "STANDARD PLAN";
  const usedSeats = dashboardData?.subscription?.usedSeats ?? institution?.usedSeats ?? 0;
  const seatLimit = dashboardData?.subscription?.seatLimit ?? institution?.seatLimit ?? 100;
  const referralCode = dashboardData?.institution?.referralCode || institution?.referralCode || "";
  const [copiedHeaderCode, setCopiedHeaderCode] = useState(false);

  const handleCopyHeaderCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedHeaderCode(true);
      setTimeout(() => setCopiedHeaderCode(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search Input */}
        <div ref={searchRef} className="hidden md:flex w-full max-w-md relative">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search portal modules or tools..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="h-10 rounded-full border-border/60 bg-muted/40 pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-xs font-medium"
            />
          </div>

          {/* Results Dropdown */}
          {isOpen && searchQuery && (
            <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden py-2 max-h-[300px] overflow-y-auto sidebar-scroll">
              <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
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
                      className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition text-foreground"
                    >
                      <div className="p-1.5 rounded-lg bg-muted text-foreground shrink-0">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate leading-none mb-0.5">
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

        {/* Center / Right Header Badges */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Quick Referral Code Button Pill */}
          {referralCode && (
            <button
              type="button"
              onClick={handleCopyHeaderCode}
              title="Click to copy institution referral code"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-bold transition active:scale-95"
            >
              <Key className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono tracking-wider">{referralCode}</span>
              {copiedHeaderCode ? (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ml-0.5">Copied!</span>
              ) : (
                <Copy className="h-3 w-3 opacity-60 ml-0.5" />
              )}
            </button>
          )}

          {/* Institution Pill Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-muted/50 border border-border/60 px-3.5 py-1.5 rounded-full">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
              {instName}
            </span>
          </div>

          {/* Seat Quota Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {planBadge} ({usedSeats}/{seatLimit} Seats)
            </span>
          </div>

          {/* Theme Toggler (NextThemes) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-32">
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

          {/* Divider */}
          <div className="h-5 w-px bg-border mx-1" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-full px-2 hover:bg-muted gap-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {(user?.name || "Admin").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold leading-tight text-foreground truncate max-w-[100px]">
                    {user?.name || "School Admin"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-bold text-xs text-foreground">{user?.name || "School Administrator"}</p>
                <p className="text-[10px] text-muted-foreground">{user?.email || "admin@school.edu"}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription Tier</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
