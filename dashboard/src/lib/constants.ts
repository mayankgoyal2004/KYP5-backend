import {
  LayoutDashboard,
  MessageSquareWarning,
  ClipboardList,
  Building2,
  Users,
  FileText,
  Map,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Grievances",
    url: "/grievances",
    icon: MessageSquareWarning,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Projects",
    url: "/projects",
    icon: ClipboardList,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Institutions",
    url: "/institutions",
    icon: Building2,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Community",
    url: "/community",
    icon: Users,
    roles: ["super_admin", "mla", "staff"],
  },
  // {
  //   title: "Schemes",
  //   url: "/schemes",
  //   icon: FileText,
  //   roles: ["super_admin", "mla", "staff"],
  // },
  {
    title: "Wards",
    url: "/wards",
    icon: Map,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["super_admin", "mla", "staff"],
  },
  {
    title: "Admin Panel",
    url: "/admin",
    icon: ShieldCheck,
    roles: ["super_admin"],
  },
] as const;

export const GRIEVANCE_CATEGORIES: Record<string, string> = {
  road: "Road & Infrastructure",
  water: "Water Supply",
  electricity: "Electricity",
  sanitation: "Sanitation",
  safety: "Public Safety",
  education: "Education",
  health: "Health",
  other: "Other",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  in_progress: "bg-primary/15 text-primary",
  resolved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  completed: "bg-success/15 text-success",
  running: "bg-primary/15 text-primary",
  on_hold: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  under_maintenance: "bg-warning/15 text-warning",
  closed: "bg-destructive/15 text-destructive",
  proposed: "bg-primary/15 text-primary",
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};
