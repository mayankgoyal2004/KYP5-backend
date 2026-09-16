import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Sparkles,
  GraduationCap,
  Clock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Key,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import {
  useTenantStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffStatusMutation,
} from "../hooks/useTenantData";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

// Role styling and descriptive badge mappings
const ROLE_CONFIG = {
  INSTITUTION_OWNER: {
    label: "Institution Owner",
    shortLabel: "Owner",
    icon: ShieldCheck,
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    description: "Principal / Managing Director with complete authority",
  },
  INSTITUTION_ADMIN: {
    label: "Institution Admin",
    shortLabel: "Admin",
    icon: Shield,
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    description: "Senior administrative officer with full access",
  },
  COUNSELOR: {
    label: "Career Counselor",
    shortLabel: "Counselor",
    icon: Sparkles,
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    description: "Counseling sessions, stream & career guidance manager",
  },
  TEACHER: {
    label: "Teacher / Proctor",
    shortLabel: "Teacher",
    icon: GraduationCap,
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    description: "Class coordinator and test proctoring facilitator",
  },
  STAFF: {
    label: "General Staff",
    shortLabel: "Staff",
    icon: Users,
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    description: "Administrative staff & student support",
  },
};

const initialCreateForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "COUNSELOR",
  status: "ACTIVE",
};

export default function StaffManagement() {
  const { user: currentUser } = useTenantAuth();

  // Search and Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals & Selected Member
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "COUNSELOR",
    status: "ACTIVE",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // API Queries & Mutations
  const { data: staffList = [], isLoading, refetch, isRefetching } = useTenantStaffQuery({
    search: search.trim() || undefined,
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const createMutation = useCreateStaffMutation();
  const updateMutation = useUpdateStaffMutation();
  const deleteMutation = useDeleteStaffMutation();
  const toggleStatusMutation = useToggleStaffStatusMutation();

  // Filtered staff list in-memory as well for responsive feel
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchEmail = m.email?.toLowerCase().includes(q);
        const matchPhone = m.phone?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      return true;
    });
  }, [staffList, search, roleFilter, statusFilter]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((m) => m.status === "ACTIVE").length;
    const counselors = staffList.filter((m) => m.role === "COUNSELOR").length;
    const teachers = staffList.filter((m) => m.role === "TEACHER").length;
    const admins = staffList.filter(
      (m) => m.role === "INSTITUTION_ADMIN" || m.role === "INSTITUTION_OWNER"
    ).length;
    return { total, active, counselors, teachers, admins };
  }, [staffList]);

  // Password Generator
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pwd = "Pass@";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.info("Generated a secure password!", { description: pwd });
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Please enter the staff member's full name");
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await createMutation.mutateAsync(createForm);
      toast.success(`Staff member "${createForm.name}" created successfully!`, {
        description: "They can now log into the school portal with these credentials.",
      });
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
      setShowPassword(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create staff member. Please try again.";
      toast.error(msg);
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name || "",
      phone: member.phone || "",
      role: member.role || "COUNSELOR",
      status: member.status || "ACTIVE",
      password: "",
    });
    setShowEditPassword(false);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!editForm.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        role: editForm.role,
        status: editForm.status,
      };
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          toast.error("Password must be at least 6 characters long");
          return;
        }
        payload.password = editForm.password.trim();
      }

      await updateMutation.mutateAsync({
        memberId: selectedMember.id,
        data: payload,
      });

      toast.success(`Account details for "${editForm.name}" updated successfully.`);
      setEditOpen(false);
      setSelectedMember(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update staff member.";
      toast.error(msg);
    }
  };

  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    try {
      await deleteMutation.mutateAsync(selectedMember.id);
      toast.success(`Staff member "${selectedMember.name}" has been removed.`);
      setDeleteOpen(false);
      setSelectedMember(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete staff member.";
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      await toggleStatusMutation.mutateAsync(member.id);
      const next = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      toast.success(`"${member.name}" marked as ${next}.`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update status.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Staff & Counselor Management
                </h1>
                <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                  {stats.total} Total
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Add, manage, and configure access permissions for school counselors, teachers, and admins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-10 rounded-xl text-xs font-semibold gap-1.5 border-border shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => {
              setCreateForm(initialCreateForm);
              setShowPassword(false);
              setCreateOpen(true);
            }}
            className="h-10 gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </Button>
        </div>
      </div>

      {/* ─── METRIC CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-xs p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Members</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.active} Active</span> in workspace
          </p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-xs p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Career Counselors</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.counselors}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            Handles stream & test guidance
          </p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-xs p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Teachers & Staff</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.teachers}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            Batch coordinators & test proctors
          </p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-xs p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Admins & Owners</p>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.admins}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            Full management permissions
          </p>
        </Card>
      </div>

      {/* ─── FILTERS AND SEARCH ─── */}
      <Card className="rounded-2xl border-border p-4 shadow-2xs bg-card/70 backdrop-blur-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
            >
              <option value="ALL">All Roles</option>
              <option value="COUNSELOR">Counselors</option>
              <option value="TEACHER">Teachers</option>
              <option value="INSTITUTION_ADMIN">Institution Admins</option>
              <option value="INSTITUTION_OWNER">Institution Owners</option>
              <option value="STAFF">General Staff</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Inactive Accounts</option>
            </select>

            {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="h-10 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ─── STAFF TABLE / LIST CARD ─── */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase tracking-wider font-extrabold text-[11px]">
                <th className="px-5 py-3.5">User / Member</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Joined Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-muted rounded" />
                          <div className="h-2.5 w-44 bg-muted rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-24 bg-muted rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="h-3 w-20 bg-muted rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-8 bg-muted rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="h-12 w-12 rounded-2xl bg-muted/70 flex items-center justify-center text-muted-foreground mb-3">
                        <Users className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">No staff members found</h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try adjusting your search criteria or filter options."
                          : "Get started by adding your first teacher, counselor, or school administrator."}
                      </p>
                      <Button
                        onClick={() => {
                          setCreateForm(initialCreateForm);
                          setCreateOpen(true);
                        }}
                        size="sm"
                        className="rounded-xl text-xs font-bold gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add First Member
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.STAFF;
                  const RoleIcon = roleConfig.icon;
                  const isCurrentUser = member.userId === currentUser?.id;
                  const isOwner = member.role === "INSTITUTION_OWNER";
                  const isActive = member.status === "ACTIVE";

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* USER INFO */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <Avatar className="h-10 w-10 rounded-xl border border-border shadow-2xs shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="h-full w-full object-cover rounded-xl" />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-xl">
                                {member.name ? member.name.substring(0, 2).toUpperCase() : "ST"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground truncate">
                                {member.name}
                              </span>
                              {isCurrentUser && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-4 font-extrabold bg-primary/15 text-primary border-transparent"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                {member.email}
                              </span>
                              {member.phone && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  • <Phone className="h-2.5 w-2.5 shrink-0" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE BADGE */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${roleConfig.badgeClass}`}
                        >
                          <RoleIcon className="h-3.5 w-3.5 shrink-0" />
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="px-5 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/60 border border-border px-2.5 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* JOINED / CREATED */}
                      <td className="px-5 py-4 hidden md:table-cell text-muted-foreground text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {member.joinedAt
                            ? new Date(member.joinedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>

                      {/* ACTIONS DROPDOWN */}
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => openEditModal(member)}
                              className="cursor-pointer gap-2 font-medium text-xs py-2"
                            >
                              <Pencil className="h-3.5 w-3.5 text-primary" />
                              <span>Edit Details & Role</span>
                            </DropdownMenuItem>

                            {!isOwner && !isCurrentUser && (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(member)}
                                className="cursor-pointer gap-2 font-medium text-xs py-2"
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Deactivate Account</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Activate Account</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}

                            {!isOwner && !isCurrentUser && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteModal(member)}
                                  className="cursor-pointer gap-2 font-bold text-xs py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Remove Staff Member</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── CREATE STAFF MEMBER MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <UserPlus className="h-4 w-4" />
              </div>
              <span>Add Staff / Counselor Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly create a login account for a teacher, counselor, or school administrator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Dr. Priya Sharma"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Official Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. priya.sharma@school.edu"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Password with generator & show toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Login Password <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Key className="h-3 w-3" />
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters (e.g. Pass@9281)"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="h-10 rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                They will use this email and password to log in to the School Portal.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. +91 9876543210"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Assigned Role <span className="text-destructive">*</span>
              </label>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, role: e.target.value }))
                }
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="COUNSELOR">
                  Career Counselor (Stream Guidance & Student Notes)
                </option>
                <option value="TEACHER">
                  Teacher (Batch Coordination & Assessment Proctoring)
                </option>
                <option value="INSTITUTION_ADMIN">
                  Institution Administrator (Full Workspace Control)
                </option>
                <option value="STAFF">
                  General Staff (Student Directory & Basic Support)
                </option>
              </select>
            </div>

            {/* Status selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Account Status</label>
              <select
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, status: e.target.value }))
                }
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ACTIVE">Active (Immediate Login Access)</option>
                <option value="INACTIVE">Inactive (Access Suspended)</option>
              </select>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Staff Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── EDIT STAFF MEMBER MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Pencil className="h-4 w-4" />
              </div>
              <span>Edit Staff Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update {selectedMember?.name}'s role, contact details, or reset password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
            {/* Read-only Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Address (Read-only)</label>
              <Input
                value={selectedMember?.email || ""}
                disabled
                className="h-10 rounded-xl text-xs bg-muted text-muted-foreground"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Phone Number</label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="COUNSELOR">Counselor</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="INSTITUTION_ADMIN">Institution Admin</option>
                  <option value="STAFF">General Staff</option>
                  {selectedMember?.role === "INSTITUTION_OWNER" && (
                    <option value="INSTITUTION_OWNER">Institution Owner</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Reset Password Optional */}
            <div className="space-y-1.5 pt-1 border-t border-border/60">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                Reset Password <span className="text-muted-foreground font-normal">(Leave blank to keep existing)</span>
              </label>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 chars)"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="h-10 rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showEditPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <AlertTriangle className="h-5 w-5" />
              <span>Remove Staff Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{selectedMember?.name}</strong> (
              {selectedMember?.email}) from this institution workspace? They will lose login access immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirm Removal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
