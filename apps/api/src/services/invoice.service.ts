import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * ─────────────────────────────────────────────────────────────
 * Invoice PDF generator — professional letterhead style
 * ─────────────────────────────────────────────────────────────
 * Design notes:
 * - One accent color used sparingly (headings, table header, total row)
 * - No solid colored banner across the top — real invoices use a
 *   letterhead: logo/company block + invoice meta, both in black/gray
 * - Line items in a real table (borders, aligned columns) via autoTable
 * - GST/tax line included (remove if not applicable in your billing)
 * - Login credentials are NOT included by default — see note below
 */

interface InvoiceData {
  invoiceNumber: string;
  userName: string;
  userEmail: string;
  userAddress?: string; // optional billing address line
  packageName: string;
  packageDescription?: string; // optional second line under package name
  amount: number; // in paise
  discountAmount: number; // in paise
  taxRate?: number; // e.g. 18 for 18% GST — omit if not applicable
  date: Date;
  dueDate?: Date; // omit for "paid on purchase" invoices
  paymentMethod?: string; // e.g. "Razorpay - UPI", "Card ending 4242"
  paymentStatus?: "PAID" | "PENDING" | "REFUNDED";
}

// ── Company details — pull from env so this file has no hardcoded
// company data. Fill these into your .env for a real letterhead.
const COMPANY_NAME = process.env.EMAIL_FROM_NAME || "LMS Portal";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "";
const COMPANY_GSTIN = process.env.COMPANY_GSTIN || "";
const COMPANY_EMAIL = process.env.COMPANY_SUPPORT_EMAIL || "";
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || "";

// Single accent color, used only for emphasis (not backgrounds everywhere)
const ACCENT: [number, number, number] = [37, 47, 87]; // deep navy — reads as "corporate", not "template"
const TEXT_DARK: [number, number, number] = [31, 31, 31];
const TEXT_MUTED: [number, number, number] = [107, 114, 128];
const BORDER: [number, number, number] = [225, 227, 232];

function formatPrice(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // ── Letterhead ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text(COMPANY_NAME, margin, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  let metaY = y + 9;
  if (COMPANY_ADDRESS) {
    doc.text(COMPANY_ADDRESS, margin, metaY, { maxWidth: contentWidth * 0.55 });
    metaY += 4;
  }
  const contactLine = [COMPANY_EMAIL, COMPANY_WEBSITE]
    .filter(Boolean)
    .join("  •  ");
  if (contactLine) doc.text(contactLine, margin, metaY);
  if (COMPANY_GSTIN) doc.text(`GSTIN: ${COMPANY_GSTIN}`, margin, metaY + 4);

  // Right-aligned invoice meta block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  doc.text("INVOICE", pageWidth - margin, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - margin, y + 11, {
    align: "right",
  });
  doc.text(`Date: ${formatDate(data.date)}`, pageWidth - margin, y + 15.5, {
    align: "right",
  });
  if (data.dueDate) {
    doc.text(`Due: ${formatDate(data.dueDate)}`, pageWidth - margin, y + 20, {
      align: "right",
    });
  }

  y += 30;

  // Divider
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── Bill To / Payment status row ─────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("BILL TO", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.userName, margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(data.userEmail, margin, y + 11.5);
  if (data.userAddress) {
    doc.text(data.userAddress, margin, y + 16.5, {
      maxWidth: contentWidth * 0.55,
    });
  }

  // Status badge, right-aligned
  if (data.paymentStatus) {
    const statusColor: Record<string, [number, number, number]> = {
      PAID: [22, 130, 90],
      PENDING: [180, 130, 20],
      REFUNDED: [150, 60, 60],
    };
    const c = statusColor[data.paymentStatus] || TEXT_MUTED;
    doc.setDrawColor(...c);
    doc.setLineWidth(0.5);
    const label = data.paymentStatus;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const w = doc.getTextWidth(label) + 10;
    doc.roundedRect(pageWidth - margin - w, y - 5, w, 8, 1.5, 1.5, "S");
    doc.setTextColor(...c);
    doc.text(label, pageWidth - margin - w / 2, y, { align: "center" });
  }
  if (data.paymentMethod) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`via ${data.paymentMethod}`, pageWidth - margin, y + 7, {
      align: "right",
    });
  }

  y += 26;

  // ── Line items table ──────────────────────────────────────
  const netAmount = data.amount - data.discountAmount;
  const taxAmount = data.taxRate
    ? Math.round((netAmount * data.taxRate) / 100)
    : 0;
  const grandTotal = netAmount + taxAmount;

  const rows: (
    | string
    | { content: string; styles?: Record<string, unknown> }
  )[][] = [
    [
      {
        content: data.packageDescription
          ? `${data.packageName}\n${data.packageDescription}`
          : data.packageName,
      },
      { content: formatPrice(data.amount), styles: { halign: "right" } },
    ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Description", "Amount"]],
    body: rows as any,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: TEXT_DARK,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: ACCENT,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      1: { halign: "right", cellWidth: 40 },
    },
  });

  // @ts-expect-error - lastAutoTable is added by the plugin at runtime
  y = doc.lastAutoTable.finalY + 8;

  // ── Totals block (right-aligned, no boxes — just alignment) ─
  const totalsX = pageWidth - margin;
  const labelX = totalsX - 50;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Subtotal", labelX, y);
  doc.setTextColor(...TEXT_DARK);
  doc.text(formatPrice(data.amount), totalsX, y, { align: "right" });
  y += 6;

  if (data.discountAmount > 0) {
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Discount", labelX, y);
    doc.setTextColor(22, 130, 90);
    doc.text(`- ${formatPrice(data.discountAmount)}`, totalsX, y, {
      align: "right",
    });
    y += 6;
  }

  if (data.taxRate) {
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`GST (${data.taxRate}%)`, labelX, y);
    doc.setTextColor(...TEXT_DARK);
    doc.text(formatPrice(taxAmount), totalsX, y, { align: "right" });
    y += 6;
  }

  y += 2;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(labelX - 3, y - 4, totalsX, y - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...ACCENT);
  doc.text("Total", labelX, y + 2);
  doc.text(formatPrice(grandTotal), totalsX, y + 2, { align: "right" });

  y += 20;

  // ── Footer ─────────────────────────────────────────────────
  const footerY = pageHeight - margin - 14;
  doc.setDrawColor(...BORDER);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    "This is a system-generated invoice and does not require a signature.",
    margin,
    footerY + 6,
  );
  if (COMPANY_EMAIL) {
    doc.text(
      `Questions about this invoice? Contact ${COMPANY_EMAIL}`,
      margin,
      footerY + 10.5,
    );
  }
  doc.text(`${COMPANY_NAME}`, pageWidth - margin, footerY + 6, {
    align: "right",
  });

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * ─────────────────────────────────────────────────────────────
 * NOTE ON CREDENTIALS
 * ─────────────────────────────────────────────────────────────
 * The original version embedded the user's plaintext password
 * directly in the invoice PDF. This is not recommended:
 *  - Invoices get forwarded, archived, and indexed by email clients
 *  - PDFs often live in Downloads folders indefinitely
 *  - It conflates "proof of payment" with "account security"
 *
 * Recommended alternative: send a separate "Welcome — set your
 * password" email with a short-lived, single-use link, decoupled
 * from the invoice email entirely.
 */
