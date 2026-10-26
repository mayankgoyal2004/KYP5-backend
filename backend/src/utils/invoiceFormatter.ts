export interface FinancialBreakdown {
  total: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  currency: string;
}

export interface InvoiceLineItem {
  id: string;
  title: string;
  description: string;
  period?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface EnrichedInvoice {
  id: string;
  invoiceNumber: string;
  institutionId: string;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl?: string | null;
  issuedAt: Date | string;
  paidAt?: Date | string | null;
  institution: {
    id: string;
    name: string;
    email?: string | null;
    phone1?: string | null;
    referralCode: string;
    logoUrl?: string | null;
  };
  subscription?: {
    id: string;
    planId: string;
    planCode?: string;
    planName?: string;
    billingCycle: string;
    seatLimit: number;
    currentPeriodStart?: Date | string;
    currentPeriodEnd?: Date | string;
    plan?: any;
  } | null;
  paymentDetails?: {
    gateway: string;
    orderId?: string | null;
    paymentId?: string | null;
    status?: string | null;
  } | null;
  financialBreakdown: FinancialBreakdown;
  lineItems: InvoiceLineItem[];
}

export function calculateFinancialBreakdown(amount: number, currency: string = "INR"): FinancialBreakdown {
  const total = Math.round(Number(amount) * 100) / 100;
  // Standard 18% GST calculation (reverse calculated from gross total)
  const subtotal = Math.round((total / 1.18) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;
  const halfTax = Math.round((taxAmount / 2) * 100) / 100;

  return {
    total,
    subtotal,
    taxRate: 18,
    taxAmount,
    cgst: halfTax,
    sgst: halfTax,
    currency,
  };
}

export function formatInvoice(
  invoice: any,
  institution: any,
  subscription?: any,
  paymentOrder?: any
): EnrichedInvoice {
  const breakdown = calculateFinancialBreakdown(invoice.amount, invoice.currency || "INR");

  const planName = subscription?.plan?.name || "KYP5 Institution Subscription";
  const planCode = subscription?.plan?.code || "SAAS_PLAN";
  const billingCycle = subscription?.billingCycle || "ANNUAL";
  const seatLimit = subscription?.seatLimit || subscription?.plan?.maxStudents || 100;

  let periodStr = "";
  if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
    const s = new Date(subscription.currentPeriodStart).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const e = new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    periodStr = `${s} to ${e}`;
  }

  const lineItems: InvoiceLineItem[] = [
    {
      id: `item-${invoice.id}-1`,
      title: `${planName} - ${billingCycle === "ANNUAL" ? "Annual" : "Monthly"} License`,
      description: `Psychometric & Career Assessment SaaS Platform for up to ${seatLimit} student accounts, counselor workspace, cohort analytics, and automated reporting.`,
      period: periodStr || undefined,
      quantity: 1,
      unitPrice: breakdown.subtotal,
      totalPrice: breakdown.subtotal,
    },
  ];

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    institutionId: invoice.institutionId,
    subscriptionId: invoice.subscriptionId,
    amount: invoice.amount,
    currency: invoice.currency || "INR",
    status: invoice.status || "PAID",
    invoiceUrl: invoice.invoiceUrl,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    institution: {
      id: institution.id,
      name: institution.name,
      email: institution.email,
      phone1: institution.phone1,
      referralCode: institution.referralCode,
      logoUrl: institution.logoUrl,
    },
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.planId,
          planCode,
          planName,
          billingCycle,
          seatLimit,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          plan: subscription.plan,
        }
      : null,
    paymentDetails: paymentOrder
      ? {
          gateway: paymentOrder.gateway || "RAZORPAY",
          orderId: paymentOrder.orderId,
          paymentId: paymentOrder.paymentId,
          status: paymentOrder.status,
        }
      : {
          gateway: "DIRECT_INVOICE",
          status: invoice.status,
        },
    financialBreakdown: breakdown,
    lineItems,
  };
}

export function generateInvoiceHtml(inv: EnrichedInvoice): string {
  const issuedDate = new Date(inv.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const paidDate = inv.paidAt
    ? new Date(inv.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unpaid / Pending";

  const isPaid = inv.status === "PAID";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${inv.invoiceNumber} - KYP5 Assessment Platform</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background-color: #f8fafc;
      color: #1e293b;
      padding: 40px 20px;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      position: relative;
    }
    .print-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 24px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #145591;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #0f3f6c;
    }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 32px;
      margin-bottom: 32px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #145591;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -1px;
      text-transform: uppercase;
    }
    .invoice-number {
      font-family: monospace;
      font-size: 15px;
      font-weight: 700;
      color: #145591;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid {
      background-color: #dcfce7;
      color: #15803d;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #b45309;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }
    .info-box h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .info-box p {
      font-size: 14px;
      color: #334155;
      line-height: 1.5;
    }
    .info-box .entity-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .items-table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .items-table .item-title {
      font-weight: 600;
      color: #0f172a;
      display: block;
    }
    .items-table .item-desc {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .items-table .item-period {
      display: inline-block;
      margin-top: 6px;
      font-size: 11px;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
    .text-right {
      text-align: right;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 36px;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-table tr.grand-total td {
      border-top: 2px solid #e2e8f0;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 800;
      color: #145591;
    }
    .stamp-container {
      position: absolute;
      top: 210px;
      right: 48px;
      border: 3px dashed #15803d;
      color: #15803d;
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 8px 24px;
      transform: rotate(-10deg);
      border-radius: 12px;
      letter-spacing: 2px;
      opacity: 0.85;
      pointer-events: none;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .invoice-wrapper {
        border: none;
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="invoice-wrapper">
    ${isPaid ? `<div class="stamp-container">PAID</div>` : ""}

    <div class="header">
      <div>
        <div class="brand-title">KYP5 Platform</div>
        <div class="brand-subtitle">Know Your Potential • Educational Assessment & Career Analytics</div>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
          GSTIN: 07AAACK1234F1Z8<br>
          Email: support@kyp5.com | Web: https://kyp5.com
        </p>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Tax Invoice</div>
        <div class="invoice-number">${inv.invoiceNumber}</div>
        <div>
          <span class="status-badge ${isPaid ? "status-paid" : "status-pending"}">
            ${inv.status}
          </span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Billed To (Institution):</h4>
        <div class="entity-name">${inv.institution.name}</div>
        <p>
          Referral Code: <strong>${inv.institution.referralCode}</strong><br>
          ${inv.institution.email ? `Email: ${inv.institution.email}<br>` : ""}
          ${inv.institution.phone1 ? `Phone: ${inv.institution.phone1}<br>` : ""}
        </p>
      </div>
      <div class="info-box text-right">
        <h4>Invoice Details:</h4>
        <p>
          Invoice Date: <strong>${issuedDate}</strong><br>
          Paid Date: <strong>${paidDate}</strong><br>
          Currency: <strong>${inv.currency}</strong><br>
          ${inv.paymentDetails?.paymentId ? `Transaction ID: <span style="font-family: monospace;">${inv.paymentDetails.paymentId}</span><br>` : ""}
          ${inv.paymentDetails?.gateway ? `Payment Mode: <strong>${inv.paymentDetails.gateway}</strong>` : ""}
        </p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 55%;">Description</th>
          <th class="text-right" style="width: 15%;">Qty</th>
          <th class="text-right" style="width: 15%;">Rate (INR)</th>
          <th class="text-right" style="width: 15%;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${inv.lineItems
          .map(
            (item) => `
          <tr>
            <td>
              <span class="item-title">${item.title}</span>
              <span class="item-desc">${item.description}</span>
              ${item.period ? `<span class="item-period">Active Period: ${item.period}</span>` : ""}
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="text-right" style="font-weight: 600;">₹${item.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td>Subtotal (Taxable Value):</td>
          <td class="text-right">₹${inv.financialBreakdown.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>CGST (9%):</td>
          <td class="text-right">₹${inv.financialBreakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td>SGST (9%):</td>
          <td class="text-right">₹${inv.financialBreakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right">₹${inv.financialBreakdown.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>This is a computer-generated tax invoice and does not require a physical signature.</p>
      <p>Thank you for choosing KYP5 Platform. For billing inquiries, contact billing@kyp5.com</p>
    </div>
  </div>
</body>
</html>`;
}
