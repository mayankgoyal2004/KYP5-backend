import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Building2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Receipt,
  FileText,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  Eye,
  Printer,
  Download,
  Search,
  Filter,
} from "lucide-react";
import {
  useTenantBillingStatusQuery,
  useTenantBillingHistoryQuery,
  useTenantDashboardQuery,
  useCreateCheckoutMutation,
  useVerifyPaymentMutation,
} from "../hooks/useTenantData";
import { useTenantAuth } from "../contexts/TenantAuthContext";
import InvoiceReceiptModal from "../components/billing/InvoiceReceiptModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../lib/utils";
import { toast } from "sonner";

export default function SubscriptionBilling() {
  const { user, institution } = useTenantAuth();
  const { data: dashboardData, refetch: refetchDashboard } = useTenantDashboardQuery();
  const { data: billingStatus, isLoading: isStatusLoading, refetch: refetchStatus } =
    useTenantBillingStatusQuery();
  const { data: billingHistory, isLoading: isHistoryLoading, refetch: refetchHistory } =
    useTenantBillingHistoryQuery();

  const createCheckoutMutation = useCreateCheckoutMutation();
  const verifyPaymentMutation = useVerifyPaymentMutation();

  const [billingCycle, setBillingCycle] = useState("ANNUAL");
  const [processingPlanCode, setProcessingPlanCode] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Invoice Management State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [historyTab, setHistoryTab] = useState("invoices"); // "invoices" | "orders"
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL");

  const paymentOrders = billingHistory?.orders || [];
  const rawInvoices = billingHistory?.invoices || [];

  const filteredInvoices = rawInvoices.filter((inv) => {
    const term = invoiceSearch.toLowerCase().trim();
    const matchesSearch =
      !term ||
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.subscription?.planName?.toLowerCase().includes(term) ||
      inv.subscription?.planCode?.toLowerCase().includes(term);

    const matchesStatus =
      invoiceStatusFilter === "ALL" || inv.status === invoiceStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const latestPaidInvoice = rawInvoices.find((inv) => inv.status === "PAID") || rawInvoices[0];
  const totalInvoiced = rawInvoices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidInvoicesCount = rawInvoices.filter((inv) => inv.status === "PAID").length;

  const currentPlanCode =
    billingStatus?.plan?.code ||
    (dashboardData?.subscription?.planName?.includes("BRONZE")
      ? "BRONZE"
      : dashboardData?.subscription?.planName?.includes("GOLD")
      ? "GOLD"
      : dashboardData?.subscription?.planName?.includes("ENTERPRISE")
      ? "ENTERPRISE"
      : "SILVER") ||
    institution?.planCode ||
    "BRONZE";

  const usedSeats =
    billingStatus?.usedSeats ??
    dashboardData?.subscription?.usedSeats ??
    institution?.usedSeats ??
    0;

  const seatLimit =
    billingStatus?.seatLimit ??
    dashboardData?.subscription?.seatLimit ??
    billingStatus?.plan?.maxStudents ??
    institution?.seatLimit ??
    100;

  const seatPercentage =
    seatLimit > 0 ? Math.min(100, Math.round((usedSeats / seatLimit) * 100)) : 0;

  const currentPlanName =
    billingStatus?.plan?.name ||
    dashboardData?.subscription?.planName ||
    `${currentPlanCode} PLAN`;

  const currentPeriodEnd =
    billingStatus?.currentPeriodEnd ||
    dashboardData?.subscription?.currentPeriodEnd;

  const plans = [
    {
      code: "BRONZE",
      name: "Bronze Starter Plan",
      badgeText: "Starter",
      description: "Ideal for small coaching centers and institutes.",
      priceMonthly: 1999,
      priceAnnual: 19990,
      maxStudents: 100,
      features: [
        "Up to 100 students / year",
        "Standard Psychometric & Career Tests",
        "PDF Student Report Generation",
        "Basic Admin Management",
        "Email Support",
      ],
    },
    {
      code: "SILVER",
      name: "Silver Standard Plan",
      badgeText: "Most Popular",
      description: "Designed for mid-sized schools and academies.",
      priceMonthly: 4999,
      priceAnnual: 49990,
      maxStudents: 500,
      features: [
        "Up to 500 students / year",
        "All Psychometric & Career Assessments",
        "Student Performance Analytics",
        "Basic Student Counseling Notes",
        "Pay-per-test Standard Checkout Option",
        "Priority Support",
      ],
    },
    {
      code: "GOLD",
      name: "Gold Pro Plan",
      badgeText: "Pro",
      description: "Built for large schools, colleges, and educational groups.",
      priceMonthly: 12999,
      priceAnnual: 119990,
      maxStudents: 2000,
      features: [
        "Up to 2,000 students / year",
        "Institutional Custom Branding on Reports",
        "Full Counseling & Stream Recommendation Logs",
        "Pay-per-test Institutional Discounted Rates",
        "Priority Technical Support & Onboarding",
        "Batch CSV Student Import",
      ],
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise Custom Plan",
      badgeText: "Enterprise",
      description: "Tailored multi-campus governance for universities.",
      priceMonthly: 29999,
      priceAnnual: 299990,
      maxStudents: 10000,
      features: [
        "Unlimited / Custom Student Seats",
        "Custom Subdomain & Full White-Labeling",
        "Custom Assessment Group Mappings & Field Templates",
        "Dedicated Account Manager",
        "24/7 Dedicated Support",
      ],
    },
  ];

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleRazorpayUpgrade = async (plan) => {
    setProcessingPlanCode(plan.code);

    try {
      // 1. Request Order Creation from Backend
      const orderData = await createCheckoutMutation.mutateAsync({
        planCode: plan.code,
        billingCycle,
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Unable to create checkout order.");
      }

      // 2. Configure Razorpay SDK Modal
      const options = {
        key: orderData.key || "rzp_live_Rc1ddOAyZ8Oj9P",
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "KYP-5 Assessment Platform",
        description: `Upgrade to ${orderData.planName} (${billingCycle})`,
        image: `${(import.meta.env.VITE_PUBLIC_WEBSITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://kyp5.com")).replace(/\/+$/, "")}/favicon.svg`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || institution?.name || "Institution Admin",
          email: user?.email || institution?.email || "admin@school.edu",
          contact: institution?.phone1 || user?.phone || "",
        },
        notes: {
          institutionId: institution?.id,
          planCode: plan.code,
          billingCycle,
        },
        theme: {
          color: "#13538A",
        },
        handler: async function (response) {
          try {
            toast.loading("Verifying payment with gateway...", { id: "verify-toast" });

            const verifyRes = await verifyPaymentMutation.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            toast.dismiss("verify-toast");
            toast.success("Payment Successful! Your subscription has been upgraded.", {
              description: `You are now on the ${plan.name} (${billingCycle}).`,
            });
            refetchStatus();
            refetchHistory();
          } catch (verifyErr) {
            toast.dismiss("verify-toast");
            toast.error(
              verifyErr.response?.data?.message || "Payment verification failed. Please contact support."
            );
          } finally {
            setProcessingPlanCode(null);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanCode(null);
            toast.info("Payment window closed.");
          },
        },
      };

      // 3. Open Razorpay Modal
      if (typeof window.Razorpay === "function") {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error("Payment failed", {
            description: response.error?.description || "Transaction was not completed.",
          });
          setProcessingPlanCode(null);
        });
        rzp.open();
      } else {
        // Fallback: Dynamically load Razorpay script if not already on window
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        script.onerror = () => {
          toast.error("Failed to load Razorpay payment gateway script.");
          setProcessingPlanCode(null);
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to initiate payment.");
      setProcessingPlanCode(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Institution Billing & Quotas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Subscription & Seat Quotas
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Manage your school subscription tier, student capacity limits, and invoice billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStatus();
              refetchHistory();
              refetchDashboard();
              toast.info("Refreshed billing records.");
            }}
            className="gap-2 text-xs font-bold rounded-xl border-border bg-card"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ─── Current Plan Active Summary Card ─── */}
      <Card className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-background shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Column 1: Current Plan */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Current Subscription
              </span>
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl font-black text-foreground">{currentPlanName}</h3>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Renews: {currentPeriodEnd ? formatDate(currentPeriodEnd) : "Annual Renewal"}
                </span>
              </p>
            </div>

            {/* Column 2: Seat Quota Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Student Seat Utilization</span>
                </span>
                <span className="text-primary font-black">
                  {usedSeats.toLocaleString()} / {seatLimit.toLocaleString()} Seats
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    seatPercentage >= 90
                      ? "bg-rose-500"
                      : seatPercentage >= 75
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${seatPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{seatPercentage}% of total capacity used</span>
                <span>{(seatLimit - usedSeats).toLocaleString()} seats remaining</span>
              </div>
            </div>

            {/* Column 3: Instant Support & Razorpay Secure Badge */}
            <div className="flex flex-col sm:items-end justify-center space-y-2 text-xs text-muted-foreground border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Razorpay Secured Live Checkout</span>
              </div>
              <p className="text-[11px] text-muted-foreground text-left sm:text-right">
                Immediate automatic quota expansion upon payment confirmation.
              </p>
              {latestPaidInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(latestPaidInvoice)}
                  className="gap-1.5 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 cursor-pointer mt-1"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>View Latest Invoice ({latestPaidInvoice.invoiceNumber})</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Billing Cycle Switcher ─── */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex bg-muted p-1 rounded-full border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "MONTHLY"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              billingCycle === "ANNUAL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual Billing</span>
            <span className="bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
              Save 20%
            </span>
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          All annual plans receive priority onboarding and complimentary teacher licenses.
        </p>
      </div>

      {/* ─── Pricing Plan Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlanCode === p.code;
          const price =
            billingCycle === "ANNUAL" ? p.priceAnnual : p.priceMonthly;
          const isProcessing = processingPlanCode === p.code;

          return (
            <Card
              key={p.code}
              className={`rounded-3xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                isCurrent
                  ? "border-primary ring-2 ring-primary/20 shadow-xl bg-card"
                  : "border-border/80 hover:border-border hover:shadow-md bg-card"
              }`}
            >
              {/* Badge Tag */}
              {isCurrent ? (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs">
                  CURRENT ACTIVE PLAN
                </div>
              ) : p.badgeText ? (
                <div className="absolute top-0 right-0 bg-muted text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-1 px-3 rounded-bl-xl border-b border-l border-border/60">
                  {p.badgeText}
                </div>
              ) : null}

              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {p.name}
                </CardTitle>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-black text-foreground">
                    ₹{price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {" "}
                    / {billingCycle === "ANNUAL" ? "year" : "month"}
                  </span>
                </div>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  {p.maxStudents
                    ? `Includes up to ${p.maxStudents.toLocaleString()} student seats`
                    : "Unlimited platform capacity"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-2 flex-1">
                <div className="border-t border-border/60 my-4" />
                <ul className="space-y-3 text-xs text-foreground/85 font-medium">
                  {p.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  onClick={() => handleRazorpayUpgrade(p)}
                  disabled={isCurrent || isProcessing || processingPlanCode !== null}
                  className={`w-full h-11 rounded-xl font-bold text-xs shadow-xs transition-all ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  }`}
                >
                  {isProcessing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initiating Razorpay...</span>
                    </span>
                  ) : isCurrent ? (
                    "Active Plan"
                  ) : (
                    `Upgrade to ${p.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* ─── Invoice & Payment Management Section ─── */}
      <div className="space-y-6 pt-6 border-t border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span>Invoices & Payment Records</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official tax invoices, subscription receipts, GST breakdowns, and payment gateway transactions.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="inline-flex bg-muted p-1 rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setHistoryTab("invoices")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                historyTab === "invoices"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Official Invoices</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                {rawInvoices.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab("orders")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                historyTab === "orders"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Checkout Orders</span>
              <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/20 text-muted-foreground text-[10px] font-black">
                {paymentOrders.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: Official Invoices ─── */}
        {historyTab === "invoices" && (
          <div className="space-y-4">
            {/* KPI Metric Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                  Total Invoiced
                </span>
                <span className="text-lg font-black text-foreground mt-0.5 block">
                  ₹{totalInvoiced.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">Cumulative investment</span>
              </Card>

              <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                  Paid Invoices
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {paidInvoicesCount} Active
                </span>
                <span className="text-[10px] text-muted-foreground">Successfully verified</span>
              </Card>

              <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                  Seat Quota
                </span>
                <span className="text-lg font-black text-primary mt-0.5 block">
                  {seatLimit.toLocaleString()} Students
                </span>
                <span className="text-[10px] text-muted-foreground">{usedSeats} enrolled</span>
              </Card>

              <Card className="p-4 rounded-2xl border-border bg-card shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                  Subscription Expiry
                </span>
                <span className="text-lg font-black text-foreground mt-0.5 block">
                  {currentPeriodEnd ? formatDate(currentPeriodEnd) : "Annual Renewal"}
                </span>
                <span className="text-[10px] text-muted-foreground">Active platform license</span>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice #, plan..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PENDING">Pending Only</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                  className="rounded-xl text-xs gap-1.5 h-8 font-bold"
                >
                  <RefreshCw className="h-3 w-3 text-primary" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Invoices Table Card */}
            <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider text-[10px] border-b border-border/80">
                    <tr>
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Plan / License Details</th>
                      <th className="py-3.5 px-4">Student Quota</th>
                      <th className="py-3.5 px-4 text-right">Taxable & GST</th>
                      <th className="py-3.5 px-4 text-right">Grand Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Issued Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {isHistoryLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                          <span>Loading official invoices...</span>
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="font-bold text-sm text-foreground">No invoices match your criteria</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Official tax invoices for subscription purchases and upgrades will be listed here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const isPaid = inv.status === "PAID";
                        const sub = inv.subscription;
                        const breakdown = inv.financialBreakdown;

                        return (
                          <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                            {/* Invoice Number */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-primary dark:text-blue-400">
                                  {inv.invoiceNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(inv.invoiceNumber, inv.id)}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                  title="Copy Invoice Number"
                                >
                                  {copiedId === inv.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Plan & Cycle */}
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-foreground">
                                {sub?.planName || "B2B SaaS Plan"}
                              </p>
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {sub?.billingCycle || "Annual"} License
                              </span>
                            </td>

                            {/* Quota */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-foreground">
                                {sub?.seatLimit || 100} Seats
                              </span>
                            </td>

                            {/* Taxable & GST */}
                            <td className="py-3.5 px-4 text-right text-muted-foreground text-[11px]">
                              {breakdown ? (
                                <div>
                                  <span className="block">₹{breakdown.subtotal.toLocaleString()}</span>
                                  <span className="text-[10px] text-muted-foreground/80 block">
                                    +₹{breakdown.taxAmount.toLocaleString()} (18% GST)
                                  </span>
                                </div>
                              ) : (
                                "Included"
                              )}
                            </td>

                            {/* Grand Total */}
                            <td className="py-3.5 px-4 text-right font-black text-foreground">
                              ₹{inv.amount.toLocaleString()}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              {isPaid ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                  PAID
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
                                  {inv.status}
                                </Badge>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                              {formatDate(inv.issuedAt)}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 cursor-pointer border-border hover:bg-muted"
                                >
                                  <Eye className="h-3 w-3 text-primary" />
                                  <span>View</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const backendUrl = import.meta.env.VITE_API_URL || "/api";
                                    const token = localStorage.getItem("tenantToken");
                                    const url = `${backendUrl}/institution/billing/invoices/${inv.id}/print${token ? `?token=${encodeURIComponent(token)}` : ""}`;
                                    window.open(url, "_blank");
                                  }}
                                  className="h-7 px-2 rounded-lg text-xs font-bold gap-1 cursor-pointer border-border hover:bg-muted text-muted-foreground"
                                  title="Print Printable Slip"
                                >
                                  <Printer className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB 2: Checkout Orders ─── */}
        {historyTab === "orders" && (
          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase tracking-wider text-[10px] border-b border-border/80">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Plan / Description</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Gateway & ID</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {isHistoryLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                        <span>Loading order records...</span>
                      </td>
                    </tr>
                  ) : paymentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-bold text-sm text-foreground">No checkout orders found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Initiated Razorpay transactions will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paymentOrders.map((order) => {
                      const meta = order.metadata || {};
                      const isPaid = order.status === "PAID";
                      const isPending = order.status === "PENDING";

                      return (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground">
                                {order.orderId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(order.orderId, order.id)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                title="Copy Order ID"
                              >
                                {copiedId === order.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-foreground">
                              {meta.planName || meta.planCode || "Subscription Checkout"}
                            </p>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              {meta.billingCycle || "Annual"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-black text-foreground">
                            ₹{order.amount.toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4">
                            {order.paymentId ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                                <span>{order.paymentId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(order.paymentId, `pay_${order.id}`)}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                  title="Copy Payment ID"
                                >
                                  {copiedId === `pay_${order.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">
                                Awaiting checkout payment
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {isPaid ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                PAID
                              </Badge>
                            ) : isPending ? (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
                                PENDING
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] uppercase">
                                {order.status}
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Official Tax Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
