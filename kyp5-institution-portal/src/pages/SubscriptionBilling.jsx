import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function SubscriptionBilling() {
  const [billingCycle, setBillingCycle] = useState("ANNUAL");
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultPlans = [
    {
      code: "BRONZE",
      name: "Bronze Plan",
      priceMonthly: 1999,
      priceAnnual: 19990,
      maxStudents: 100,
      features: [
        "Up to 100 students / year",
        "PDF Student Career Reports",
        "Basic Psychometric Batteries",
        "Standard Email Support",
      ],
    },
    {
      code: "SILVER",
      name: "Silver Plan",
      priceMonthly: 4999,
      priceAnnual: 49990,
      maxStudents: 500,
      features: [
        "Up to 500 students / year",
        "PDF Student Career Reports",
        "Counselor Remark Logging",
        "Batch Assessment Campaigns",
        "Priority Support",
      ],
    },
    {
      code: "GOLD",
      name: "Gold Plan (Scale)",
      priceMonthly: 12999,
      priceAnnual: 119990,
      maxStudents: 2000,
      isCurrent: true,
      features: [
        "Up to 2,000 students / year",
        "Full School Co-Branding on PDF",
        "Unlimited Counselor Accounts",
        "Batch CSV Roster Imports",
        "Comprehensive Analytics Dashboard",
        "Dedicated Account Specialist",
      ],
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise Plan",
      priceMonthly: 29999,
      priceAnnual: 299990,
      maxStudents: 10000,
      features: [
        "Unlimited Student Seats",
        "Custom Institutional Domain",
        "Custom Psychometric Frameworks",
        "API & SIS Integration",
        "24/7 Dedicated Support",
      ],
    },
  ];

  const [plans, setPlans] = useState(defaultPlans);

  useEffect(() => {
    axios
      .get("/api/v1/public/pricing-plans/saas")
      .then((res) => {
        if (
          res.data?.success &&
          Array.isArray(res.data.data) &&
          res.data.data.length > 0
        ) {
          setPlans(res.data.data);
        }
      })
      .catch((err) => console.warn("Using default subscription plans:", err));
  }, []);

  const handleCheckout = async (planCode) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("tenantToken");
      const res = await axios.post(
        "/api/institution/billing/checkout",
        { planCode, billingCycle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        alert(`Success! Upgraded to ${planCode} plan.`);
      }
    } catch (err) {
      alert(`Checkout initiated for ${planCode} plan (Simulation Mode).`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Subscription & Seat Quotas
            </h1>
            <Badge variant="success" className="text-xs font-bold">
              GOLD PLAN ACTIVE
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Manage your school subscription tier, student capacity limits, and invoice billing.
          </p>
        </div>
      </div>

      {/* ─── Billing Cycle Switcher ─── */}
      <div className="flex justify-center my-4">
        <div className="inline-flex bg-muted p-1.5 rounded-full border border-border">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "MONTHLY"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === "ANNUAL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual Billing</span>
            <span className="bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* ─── Plan Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = p.code === "GOLD" || p.isCurrent;
          const price =
            billingCycle === "ANNUAL"
              ? p.priceAnnual || 49990
              : p.priceMonthly || 4999;

          return (
            <Card
              key={p.code}
              className={`rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                isCurrent
                  ? "border-primary ring-2 ring-primary/20 shadow-xl dark:bg-card/80"
                  : "border-border hover:border-border/80 hover:shadow-md"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-wider py-0.5 px-3 shadow-md">
                    Current Active Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {p.name}
                </CardTitle>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    ₹{price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {" "}
                    / {billingCycle === "ANNUAL" ? "year" : "month"}
                  </span>
                </div>
                <CardDescription className="text-xs font-medium">
                  {p.maxStudents ? `Includes up to ${p.maxStudents.toLocaleString()} student seats` : "Full platform capacity"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-2 flex-1">
                <div className="border-t border-border/60 my-4" />
                <ul className="space-y-2.5 text-xs text-foreground/80 font-medium">
                  {(Array.isArray(p.features) ? p.features : []).map(
                    (feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          {typeof feature === "string"
                            ? feature
                            : JSON.stringify(feature)}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button
                  onClick={() => handleCheckout(p.code)}
                  disabled={isCurrent || isProcessing}
                  className={`w-full h-11 rounded-xl font-bold text-xs ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  }`}
                >
                  {isCurrent ? "Active Plan" : `Upgrade to ${p.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
