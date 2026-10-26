import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Printer,
  Copy,
  Check,
  Calendar,
  Building2,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import { toast } from "sonner";

export default function InvoiceReceiptModal({ invoice, isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!invoice) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopied(true);
    toast.success("Invoice number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaid = invoice.status === "PAID";
  const breakdown = invoice.financialBreakdown || {
    total: invoice.amount,
    subtotal: Math.round((invoice.amount / 1.18) * 100) / 100,
    taxRate: 18,
    taxAmount: Math.round((invoice.amount - invoice.amount / 1.18) * 100) / 100,
    cgst: Math.round(((invoice.amount - invoice.amount / 1.18) / 2) * 100) / 100,
    sgst: Math.round(((invoice.amount - invoice.amount / 1.18) / 2) * 100) / 100,
    currency: invoice.currency || "INR",
  };

  const sub = invoice.subscription;
  const inst = invoice.institution;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPrintSlip = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "/api";
    const token = localStorage.getItem("tenantToken");
    const url = `${backendUrl}/institution/billing/invoices/${invoice.id}/print${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-border bg-card shadow-2xl">
        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #invoice-printable-area, #invoice-printable-area * { visibility: visible; }
              #invoice-printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
                color: black;
                padding: 20px;
              }
              .no-print { display: none !important; }
            }
          `
        }} />

        <div id="invoice-printable-area" className="p-8 sm:p-10 space-y-8 relative bg-card text-foreground">
          {/* PAID Watermark Stamp */}
          {isPaid && (
            <div className="absolute top-24 right-10 pointer-events-none select-none border-4 border-emerald-500/70 text-emerald-600 dark:text-emerald-400 font-black text-2xl uppercase tracking-widest px-6 py-2 rounded-2xl rotate-[-12deg] opacity-70">
              PAID • VERIFIED
            </div>
          )}

          {/* 1. Header with Platform Logo & Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#145591] to-[#0d365d] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                  K5
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">KYP5 Platform</h2>
                  <p className="text-[11px] font-bold text-primary">Know Your Potential • Assessment & Analytics</p>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 space-y-0.5">
                <p>GSTIN: <span className="font-mono font-semibold text-foreground">07AAACK1234F1Z8</span></p>
                <p>Support: <span className="text-foreground">billing@kyp5.com</span> | Web: <span className="text-foreground">https://kyp5.com</span></p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary block">
                Official Tax Invoice
              </span>
              <div className="flex items-center gap-2 sm:justify-end mt-1">
                <span className="font-mono text-base font-extrabold text-foreground">{invoice.invoiceNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground no-print"
                  title="Copy Invoice Number"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="mt-2 flex items-center sm:justify-end gap-2">
                <Badge
                  className={
                    isPaid
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase"
                  }
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* 2. Billed To & Invoice Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/40 border border-border/60 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-primary" />
                <span>Billed To (Institution):</span>
              </span>
              <p className="text-sm font-black text-foreground">{inst?.name || "Institution Client"}</p>
              <p className="text-muted-foreground">
                Referral Code: <span className="font-mono font-bold text-foreground">{inst?.referralCode}</span>
              </p>
              {inst?.email && <p className="text-muted-foreground">Email: {inst.email}</p>}
              {inst?.phone1 && <p className="text-muted-foreground">Phone: {inst.phone1}</p>}
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center sm:justify-end gap-1.5">
                <Calendar className="h-3 w-3 text-primary" />
                <span>Invoice Dates & Currency:</span>
              </span>
              <p className="text-muted-foreground">
                Issue Date: <strong className="text-foreground">{formatDate(invoice.issuedAt)}</strong>
              </p>
              <p className="text-muted-foreground">
                Payment Date: <strong className="text-foreground">{invoice.paidAt ? formatDate(invoice.paidAt) : "Pending"}</strong>
              </p>
              <p className="text-muted-foreground">
                Currency: <strong className="text-foreground">{invoice.currency || "INR"}</strong>
              </p>
              {invoice.paymentDetails?.paymentId && (
                <p className="text-muted-foreground">
                  Transaction ID: <span className="font-mono font-bold text-foreground text-[11px]">{invoice.paymentDetails.paymentId}</span>
                </p>
              )}
            </div>
          </div>

          {/* 3. Subscription Line Items Table */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground block">
              Purchased Subscription Details
            </span>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 text-muted-foreground font-extrabold uppercase tracking-wider text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-4 text-center">Capacity</th>
                    <th className="py-3 px-4 text-right">Taxable Rate</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.lineItems && invoice.lineItems.length > 0 ? (
                    invoice.lineItems.map((item) => (
                      <tr key={item.id} className="bg-card">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                          {item.period && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono">
                              Period: {item.period}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-foreground">
                          {sub?.seatLimit || 100} Seats
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-foreground">
                          ₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-foreground">
                          ₹{item.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-card">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground text-sm">
                          {sub?.planName || "B2B SaaS Subscription Plan"} ({sub?.billingCycle || "ANNUAL"})
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Institutional license for student career & psychometric assessment suite, automated PDF reports, and analytics.
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        {sub?.seatLimit || 100} Seats
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-foreground">
                        ₹{breakdown.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-foreground">
                        ₹{breakdown.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Tax Calculation & Grand Total Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1.5 max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Payment Confirmation</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Payment processed securely via {invoice.paymentDetails?.gateway || "Razorpay Live Gateway"}.
                This is a computer generated invoice and serves as official proof of payment.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-semibold text-foreground">
                  ₹{breakdown.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST (9.0%):</span>
                <span className="font-semibold text-foreground">
                  ₹{breakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST (9.0%):</span>
                <span className="font-semibold text-foreground">
                  ₹{breakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-foreground">Grand Total:</span>
                <span className="text-xl font-black text-[#145591] dark:text-blue-400">
                  ₹{breakdown.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Footer Notes */}
          <div className="pt-6 border-t border-border text-center text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Thank you for your partnership with KYP5 Assessment Platform.</p>
            <p>For questions or custom enterprise amendments, please reach out to billing@kyp5.com</p>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 sm:p-6 bg-muted/40 border-t border-border flex-row justify-between items-center no-print">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-bold">
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPrintSlip}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span>Full Slip Tab</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-[#145591] hover:bg-[#0e4070] text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
