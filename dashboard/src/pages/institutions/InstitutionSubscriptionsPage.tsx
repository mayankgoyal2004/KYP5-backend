import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CreditCard,
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  MoreVertical,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { toast } from "sonner";

interface Plan {
  id: string;
  code: "BRONZE" | "SILVER" | "GOLD" | "ENTERPRISE";
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxStudents: number;
}

interface SubscriptionData {
  id: string;
  planId: string;
  planCode: "BRONZE" | "SILVER" | "GOLD" | "ENTERPRISE";
  planName: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "SUSPENDED";
  billingCycle: "MONTHLY" | "ANNUAL";
  usedSeats: number;
  seatLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  plan?: Plan;
}

interface InstitutionRow {
  id: string;
  name: string;
  email: string | null;
  phone1: string | null;
  logoUrl: string | null;
  referralCode: string;
  isActive: boolean;
  studentCount: number;
  invoicesCount: number;
  subscription: SubscriptionData | null;
}

interface SummaryData {
  totalInstitutions: number;
  activeSubscriptions: number;
  expiringSoonCount: number;
  suspendedCount: number;
  pastDueOrExpiredCount: number;
  totalCapacity: number;
  totalStudentsEnrolled: number;
  estimatedMRR: number;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  institutionId: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  institution: {
    id: string;
    name: string;
    email: string | null;
    referralCode: string;
  };
}

export default function InstitutionSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("all-subscriptions");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    totalInstitutions: 0,
    activeSubscriptions: 0,
    expiringSoonCount: 0,
    suspendedCount: 0,
    pastDueOrExpiredCount: 0,
    totalCapacity: 0,
    totalStudentsEnrolled: 0,
    estimatedMRR: 0,
  });
  const [subscriptions, setSubscriptions] = useState<InstitutionRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<InstitutionRow | null>(null);
  const [upgradePlanCode, setUpgradePlanCode] = useState<string>("SILVER");
  const [upgradeCycle, setUpgradeCycle] = useState<string>("ANNUAL");
  const [customSeats, setCustomSeats] = useState<string>("");
  const [validityMonths, setValidityMonths] = useState<string>("12");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quota Modal
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [newQuota, setNewQuota] = useState<string>("");

  // Suspend / Reactivate Confirmation Modal
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendTargetInst, setSuspendTargetInst] = useState<InstitutionRow | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  // Extend Modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState<string>("30");

  // Manual Invoice Modal
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);
  const [invoiceInstId, setInvoiceInstId] = useState<string>("");
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("PAID");

  // View Invoice Slip Modal
  const [invoiceSlip, setInvoiceSlip] = useState<InvoiceRow | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    if (activeTab === "invoices") {
      fetchInvoices();
    }
  }, [search, planFilter, statusFilter, activeTab]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (planFilter !== "ALL") params.plan = planFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (activeTab === "renewals") params.expiringSoon = "true";

      const res = await api.get("/admin/subscriptions", { params });
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setSubscriptions(res.data.data.subscriptions);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await api.get("/admin/subscriptions/invoices/all", {
        params: { search: search || undefined },
      });
      if (res.data?.success) {
        setInvoices(res.data.data);
      }
    } catch (err: any) {
      toast.error("Failed to load invoices");
    } finally {
      setInvoicesLoading(false);
    }
  };

  const openUpgradeModal = (inst: InstitutionRow) => {
    setSelectedInst(inst);
    setUpgradePlanCode(inst.subscription?.planCode || "SILVER");
    setUpgradeCycle(inst.subscription?.billingCycle || "ANNUAL");
    setCustomSeats(inst.subscription?.seatLimit?.toString() || "");
    setValidityMonths("12");
    setCustomPrice("");
    setGenerateInvoice(true);
    setUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/admin/subscriptions/${selectedInst.id}/upgrade`, {
        planCode: upgradePlanCode,
        billingCycle: upgradeCycle,
        customSeatLimit: customSeats ? Number(customSeats) : undefined,
        validityMonths: Number(validityMonths) || 12,
        customPrice: customPrice ? Number(customPrice) : undefined,
        generateInvoice,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Subscription upgraded successfully!");
        setUpgradeModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSuspendModal = (inst: InstitutionRow) => {
    setSuspendTargetInst(inst);
    setSuspendModalOpen(true);
  };

  const confirmToggleSuspend = async () => {
    if (!suspendTargetInst) return;
    const isCurrentlySuspended = suspendTargetInst.subscription?.status === "SUSPENDED";
    setIsSuspending(true);
    try {
      const res = await api.post(`/admin/subscriptions/${suspendTargetInst.id}/suspend`, {
        suspend: !isCurrentlySuspended,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSuspendModalOpen(false);
        setSuspendTargetInst(null);
        fetchSubscriptions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setIsSuspending(false);
    }
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/admin/subscriptions/${selectedInst.id}/extend`, {
        days: Number(extendDays),
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setExtendModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to extend validity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/admin/subscriptions/${selectedInst.id}/quota`, {
        seatLimit: Number(newQuota),
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setQuotaModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update quota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceInstId || !invoiceAmount) {
      toast.error("Please fill in institution and amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/admin/subscriptions/invoices/manual", {
        institutionId: invoiceInstId,
        amount: Number(invoiceAmount),
        status: invoiceStatus,
      });
      if (res.data?.success) {
        toast.success("Invoice created successfully!");
        setManualInvoiceOpen(false);
        setInvoiceInstId("");
        setInvoiceAmount("");
        fetchInvoices();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkInvoicePaid = async (invId: string) => {
    try {
      const res = await api.patch(`/admin/subscriptions/invoices/${invId}/status`, {
        status: "PAID",
      });
      if (res.data?.success) {
        toast.success("Invoice marked as PAID");
        fetchInvoices();
      }
    } catch (err: any) {
      toast.error("Failed to update invoice");
    }
  };

  const getPlanBadge = (code?: string) => {
    switch (code) {
      case "BRONZE":
        return <Badge className="bg-amber-700/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Bronze</Badge>;
      case "SILVER":
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30">Silver</Badge>;
      case "GOLD":
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-400/40 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Gold Pro</Badge>;
      case "ENTERPRISE":
        return <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/40">Enterprise</Badge>;
      default:
        return <Badge variant="outline">Unassigned</Badge>;
    }
  };

  const getStatusBadge = (sub: SubscriptionData | null) => {
    if (!sub) {
      return <Badge variant="outline" className="text-slate-400">No Active Plan</Badge>;
    }
    if (sub.status === "SUSPENDED") {
      return <Badge variant="destructive" className="flex items-center gap-1"><PauseCircle className="h-3 w-3" /> Suspended</Badge>;
    }
    if (sub.isExpired) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Expired</Badge>;
    }
    if (sub.isExpiringSoon) {
      return (
        <Badge className="bg-amber-500 text-slate-950 font-bold animate-pulse flex items-center gap-1">
          <Clock className="h-3 w-3" /> Renews in {sub.daysRemaining}d
        </Badge>
      );
    }
    return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Active</Badge>;
  };

  return (
    <MainLayout title="Institution Subscriptions & Quota Management">
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#145591] dark:text-blue-300 text-xs font-bold mb-1.5 border border-blue-200 dark:border-blue-900">
              <Building2 className="h-3.5 w-3.5" />
              <span>Multi-Tenant Enterprise Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Institution Subscriptions & Quota
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Oversee school licenses, student capacity, renewals, upgrades, suspensions, and invoices.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchSubscriptions();
                if (activeTab === "invoices") fetchInvoices();
              }}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setManualInvoiceOpen(true)}
              className="bg-[#145591] hover:bg-[#0f3f6c] text-white gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Record Offline Payment</span>
            </Button>
          </div>
        </div>

        {/* ─── KPI Metrics ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Subscriptions */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Schools</span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#145591] dark:text-blue-400">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {summary.activeSubscriptions} <span className="text-sm font-normal text-muted-foreground">/ {summary.totalInstitutions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="text-emerald-600 font-semibold">
                  {summary.totalInstitutions > 0 ? Math.round((summary.activeSubscriptions / summary.totalInstitutions) * 100) : 0}%
                </span>
                <span>licensed institutions</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Student Seat Quota */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seat Utilization</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {summary.totalStudentsEnrolled.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground"> / {summary.totalCapacity.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total enrolled students across all institutions
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Est. MRR */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Monthly Revenue</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ₹{summary.estimatedMRR.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span>Calculated MRR from active plans</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Action Required */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attention Needed</span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {summary.expiringSoonCount + summary.suspendedCount + summary.pastDueOrExpiredCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.expiringSoonCount} near renewal, {summary.suspendedCount} suspended
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs Navigation ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="all-subscriptions" className="rounded-lg text-xs font-semibold gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>All Subscriptions ({summary.totalInstitutions})</span>
            </TabsTrigger>
            <TabsTrigger value="renewals" className="rounded-lg text-xs font-semibold gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Near Renewal & Overdue ({summary.expiringSoonCount + summary.pastDueOrExpiredCount})</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-lg text-xs font-semibold gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Invoices & Transactions</span>
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by institution name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeTab !== "invoices" && (
                <>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[140px] text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Plans</SelectItem>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="PAST_DUE">Past Due</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          {/* ─── TAB 1 & 2: Subscriptions Table ─── */}
          <TabsContent value="all-subscriptions" className="space-y-4">
            <SubscriptionTable
              loading={loading}
              subscriptions={subscriptions}
              onUpgrade={openUpgradeModal}
              onExtend={(inst) => {
                setSelectedInst(inst);
                setExtendDays("30");
                setExtendModalOpen(true);
              }}
              onQuota={(inst) => {
                setSelectedInst(inst);
                setNewQuota(inst.subscription?.seatLimit?.toString() || "100");
                setQuotaModalOpen(true);
              }}
              onToggleSuspend={openSuspendModal}
              getPlanBadge={getPlanBadge}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-4">
            <SubscriptionTable
              loading={loading}
              subscriptions={subscriptions}
              onUpgrade={openUpgradeModal}
              onExtend={(inst) => {
                setSelectedInst(inst);
                setExtendDays("30");
                setExtendModalOpen(true);
              }}
              onQuota={(inst) => {
                setSelectedInst(inst);
                setNewQuota(inst.subscription?.seatLimit?.toString() || "100");
                setQuotaModalOpen(true);
              }}
              onToggleSuspend={openSuspendModal}
              getPlanBadge={getPlanBadge}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          {/* ─── TAB 3: Invoices Table ─── */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Institution</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Issued Date</th>
                      <th className="py-3.5 px-4">Paid Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {invoicesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#145591]" />
                          <span>Loading invoice transactions...</span>
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          No invoices found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#145591] dark:text-blue-400">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {inv.institution?.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Ref: {inv.institution?.referralCode}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm">
                            ₹{inv.amount.toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">{inv.currency}</span>
                          </td>
                          <td className="py-3 px-4">
                            {inv.status === "PAID" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30 font-semibold">
                                Paid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-400/40">
                                {inv.status}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {inv.issuedAt ? format(new Date(inv.issuedAt), "dd MMM yyyy") : "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {inv.paidAt ? format(new Date(inv.paidAt), "dd MMM yyyy") : "-"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInvoiceSlip(inv)}
                              className="h-7 text-xs rounded-lg px-2.5"
                            >
                              View Slip
                            </Button>
                            {inv.status !== "PAID" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkInvoicePaid(inv.id)}
                                className="h-7 text-xs rounded-lg px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── MODAL 1: Upgrade / Change Plan ─── */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#145591]" />
              <span>Upgrade / Change Subscription Plan</span>
            </DialogTitle>
            <DialogDescription>
              Assign a new tier, adjust student quota, or configure billing cycles for <strong className="text-slate-900 dark:text-white">{selectedInst?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpgradeSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Subscription Plan Tier
              </label>
              <Select value={upgradePlanCode} onValueChange={setUpgradePlanCode}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRONZE">Bronze Starter (100 Students)</SelectItem>
                  <SelectItem value="SILVER">Silver Standard (500 Students)</SelectItem>
                  <SelectItem value="GOLD">Gold Pro (2,000 Students)</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise Custom (10,000 Students)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Billing Cycle
                </label>
                <Select value={upgradeCycle} onValueChange={setUpgradeCycle}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Annual (1 Year)</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Validity Duration (Months)
                </label>
                <Select value={validityMonths} onValueChange={setValidityMonths}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months (1 Year)</SelectItem>
                    <SelectItem value="24">24 Months (2 Years)</SelectItem>
                    <SelectItem value="36">36 Months (3 Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Custom Student Seat Quota (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={customSeats}
                  onChange={(e) => setCustomSeats(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Custom Invoice Amount ₹ (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="Override default price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                id="genInv"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#145591] focus:ring-[#145591]"
              />
              <label htmlFor="genInv" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Automatically generate paid invoice record for this upgrade
              </label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setUpgradeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#145591] hover:bg-[#0f3f6c] text-white"
              >
                {isSubmitting ? "Applying Upgrade..." : "Confirm & Activate Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: Adjust Seat Quota ─── */}
      <Dialog open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-[#145591]" />
              <span>Adjust Student Seat Capacity</span>
            </DialogTitle>
            <DialogDescription>
              Modify maximum allowed student registration quota for <strong className="text-slate-900 dark:text-white">{selectedInst?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuotaSubmit} className="space-y-4 py-2">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currently Enrolled Students:</span>
                <span className="font-bold">{selectedInst?.studentCount} students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Seat Limit:</span>
                <span className="font-bold">{selectedInst?.subscription?.seatLimit || 100} students</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New Student Capacity Limit
              </label>
              <Input
                type="number"
                min="1"
                required
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                placeholder="e.g. 500"
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setQuotaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#145591] hover:bg-[#0f3f6c] text-white">
                {isSubmitting ? "Saving..." : "Save Quota Limit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: Extend Validity ─── */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#145591]" />
              <span>Extend Subscription Validity</span>
            </DialogTitle>
            <DialogDescription>
              Grant extra validity days or grace period for <strong className="text-slate-900 dark:text-white">{selectedInst?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExtendSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Extension Duration
              </label>
              <Select value={extendDays} onValueChange={setExtendDays}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">+7 Days (Grace Period)</SelectItem>
                  <SelectItem value="15">+15 Days</SelectItem>
                  <SelectItem value="30">+30 Days (1 Month)</SelectItem>
                  <SelectItem value="60">+60 Days (2 Months)</SelectItem>
                  <SelectItem value="90">+90 Days (Quarterly)</SelectItem>
                  <SelectItem value="180">+180 Days (Half Year)</SelectItem>
                  <SelectItem value="365">+365 Days (1 Full Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setExtendModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#145591] hover:bg-[#0f3f6c] text-white">
                {isSubmitting ? "Extending..." : "Apply Extension"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: Record Offline Invoice ─── */}
      <Dialog open={manualInvoiceOpen} onOpenChange={setManualInvoiceOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#145591]" />
              <span>Record Offline Payment / Invoice</span>
            </DialogTitle>
            <DialogDescription>
              Record a payment received via Bank Wire, Cheque, UPI, or Cash.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualInvoiceSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Institution
              </label>
              <Select value={invoiceInstId} onValueChange={setInvoiceInstId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose an institution..." />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.referralCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (₹ INR)
                </label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 49990"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Status
                </label>
                <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setManualInvoiceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#145591] hover:bg-[#0f3f6c] text-white">
                {isSubmitting ? "Recording..." : "Record Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 5: Invoice Slip View ─── */}
      <Dialog open={!!invoiceSlip} onOpenChange={() => setInvoiceSlip(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-950 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-[#145591]">KYP5 Assessment Platform</h3>
                <p className="text-xs text-muted-foreground">Official Subscription Receipt</p>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{invoiceSlip?.invoiceNumber}</div>
                <div className="text-muted-foreground">
                  {invoiceSlip?.issuedAt ? format(new Date(invoiceSlip.issuedAt), "dd MMM yyyy") : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Billed To:</span>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {invoiceSlip?.institution?.name}
                </span>
                <span className="text-muted-foreground block font-mono">
                  Referral: {invoiceSlip?.institution?.referralCode}
                </span>
                {invoiceSlip?.institution?.email && (
                  <span className="text-muted-foreground block">{invoiceSlip?.institution?.email}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block mb-0.5">Payment Status:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600">
                  {invoiceSlip?.status}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3 flex justify-between items-center">
              <span className="font-bold text-xs">Total Amount Paid:</span>
              <span className="font-extrabold text-xl text-[#145591] dark:text-blue-400">
                ₹{invoiceSlip?.amount.toLocaleString()} {invoiceSlip?.currency}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                Print Slip
              </Button>
              <Button size="sm" onClick={() => setInvoiceSlip(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 6: Suspend / Reactivate Confirmation AlertDialog ─── */}
      <AlertDialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  suspendTargetInst?.subscription?.status === "SUSPENDED"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                }`}
              >
                {suspendTargetInst?.subscription?.status === "SUSPENDED" ? (
                  <PlayCircle className="h-6 w-6" />
                ) : (
                  <PauseCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {suspendTargetInst?.subscription?.status === "SUSPENDED"
                    ? "Reactivate Subscription"
                    : "Suspend Subscription"}
                </AlertDialogTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  {suspendTargetInst?.name} (Ref: {suspendTargetInst?.referralCode})
                </p>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400 pt-3 leading-relaxed">
              {suspendTargetInst?.subscription?.status === "SUSPENDED" ? (
                <span>
                  Are you sure you want to <strong>reactivate</strong> the subscription for <strong>{suspendTargetInst?.name}</strong>? This will immediately restore active portal access, test-taking permissions, and counseling logs for all enrolled students.
                </span>
              ) : (
                <span>
                  Are you sure you want to <strong>suspend</strong> the subscription for <strong>{suspendTargetInst?.name}</strong>? During suspension, students and staff from this institution will temporarily lose access to take assessments and download reports until reactivated.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isSuspending}
              onClick={() => {
                setSuspendModalOpen(false);
                setSuspendTargetInst(null);
              }}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              disabled={isSuspending}
              onClick={confirmToggleSuspend}
              className={`rounded-xl text-xs font-bold gap-1.5 ${
                suspendTargetInst?.subscription?.status === "SUSPENDED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              }`}
            >
              {isSuspending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : suspendTargetInst?.subscription?.status === "SUSPENDED" ? (
                <PlayCircle className="h-3.5 w-3.5" />
              ) : (
                <PauseCircle className="h-3.5 w-3.5" />
              )}
              <span>
                {isSuspending
                  ? "Updating..."
                  : suspendTargetInst?.subscription?.status === "SUSPENDED"
                  ? "Reactivate Plan"
                  : "Suspend Plan"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

interface TableProps {
  loading: boolean;
  subscriptions: InstitutionRow[];
  onUpgrade: (inst: InstitutionRow) => void;
  onExtend: (inst: InstitutionRow) => void;
  onQuota: (inst: InstitutionRow) => void;
  onToggleSuspend: (inst: InstitutionRow) => void;
  getPlanBadge: (code?: string) => React.ReactNode;
  getStatusBadge: (sub: SubscriptionData | null) => React.ReactNode;
}

function SubscriptionTable({
  loading,
  subscriptions,
  onUpgrade,
  onExtend,
  onQuota,
  onToggleSuspend,
  getPlanBadge,
  getStatusBadge,
}: TableProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Institution</th>
              <th className="py-3.5 px-4">Active Plan</th>
              <th className="py-3.5 px-4">Cycle</th>
              <th className="py-3.5 px-4">Student Capacity</th>
              <th className="py-3.5 px-4">Status & Validity</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#145591]" />
                  <span>Loading institution subscription data...</span>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No institution subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((inst) => {
                const sub = inst.subscription;
                const seatLimit = sub?.seatLimit || 100;
                const usedSeats = inst.studentCount;
                const percent = Math.min(Math.round((usedSeats / seatLimit) * 100), 100);

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Institution info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#145591] to-[#0f3f6c] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                          {inst.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {inst.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{inst.referralCode}</strong></span>
                            {inst.email && <span>• {inst.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Plan Badge */}
                    <td className="py-3.5 px-4">
                      {getPlanBadge(sub?.planCode)}
                    </td>

                    {/* Cycle */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-xs">
                        {sub?.billingCycle === "ANNUAL" ? "Annual" : "Monthly"}
                      </span>
                    </td>

                    {/* Student Capacity Progress */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {usedSeats} / {seatLimit}
                          </span>
                          <span className="text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 90 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status & Validity */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(sub)}</div>
                        {sub?.currentPeriodEnd && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Expiry: {format(new Date(sub.currentPeriodEnd), "dd MMM yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuLabel className="text-xs">Subscription Controls</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onUpgrade(inst)}
                            className="text-xs gap-2 font-medium cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-[#145591]" />
                            <span>Change / Upgrade Plan</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onExtend(inst)}
                            className="text-xs gap-2 font-medium cursor-pointer"
                          >
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            <span>Extend Expiry Date</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onQuota(inst)}
                            className="text-xs gap-2 font-medium cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Adjust Seat Quota</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onToggleSuspend(inst)}
                            className={`text-xs gap-2 font-medium cursor-pointer ${
                              sub?.status === "SUSPENDED" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {sub?.status === "SUSPENDED" ? (
                              <>
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span>Reactivate Subscription</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="h-3.5 w-3.5" />
                                <span>Suspend Subscription</span>
                              </>
                            )}
                          </DropdownMenuItem>
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
  );
}
