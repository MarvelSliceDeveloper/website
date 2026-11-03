import { readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join } from "node:path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Invoice PDF generator — clean marketplace style (Udemy-like):
 *  - Seller block: company name + logo only
 *  - Buyer block: name, email, phone, address, place of supply, optional GSTIN
 *  - SAC code, taxable value, CGST + SGST (same state) or IGST (other state)
 *  - Amount in words, payment / transaction details
 *
 * Company name/logo come from env vars (see COMPANY_* below).
 * COMPANY_STATE is still used silently to pick CGST+SGST vs IGST.
 *
 * Note: jsPDF's built-in fonts have no ₹ glyph, so amounts print as "Rs.".
 */

export interface InvoiceLineItem {
  name: string;
  description?: string;
  sac?: string; // falls back to COMPANY_SAC
  quantity?: number; // default 1
  amount: number; // unit price in paise, as listed
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId?: string;

  // Buyer
  userName: string;
  userEmail: string;
  userPhone?: string;
  userAddress?: string; // billing address (multi-line allowed with \n)
  userState?: string; // place of supply, e.g. "Tamil Nadu"
  userGstin?: string; // only for B2B invoices

  // Items — either pass `items`, or the single-package fields below
  items?: InvoiceLineItem[];
  packageName: string;
  packageDescription?: string;
  amount: number; // paise, listed price (used when `items` is omitted)
  discountAmount: number; // paise, whole-invoice discount (list-price basis)
  couponCode?: string;

  // Tax
  taxRate?: number; // e.g. 18. Omit / 0 for no GST.
  taxInclusive?: boolean; // default true: listed prices already include GST

  // Dates & payment
  date: Date;
  dueDate?: Date;
  paidOn?: Date;
  paymentMethod?: string; // e.g. "UPI"
  transactionId?: string; // UTR / gateway payment id
  paymentStatus?: "PAID" | "PENDING" | "REFUNDED";
}

// ── Company details (env-driven) ──────────────────────────────
// Letterhead shows the name + logo only. COMPANY_STATE is still read
// (silently) to decide CGST+SGST vs IGST in the tax breakup.
const COMPANY_NAME = process.env.EMAIL_FROM_NAME || "MarvelSlice LMS";
const COMPANY_LEGAL_NAME = process.env.COMPANY_LEGAL_NAME || "";
const COMPANY_STATE = process.env.COMPANY_STATE || "";
const COMPANY_SAC = process.env.COMPANY_SAC || "";
const COMPANY_LOGO_PATH = process.env.COMPANY_LOGO_PATH || ""; // PNG/JPG
const INVOICE_NOTE = process.env.COMPANY_INVOICE_NOTE || ""; // e.g. refund policy line
const DISPLAY_NAME = COMPANY_NAME || COMPANY_LEGAL_NAME || "MarvelSlice LMS";

type RGB = [number, number, number];
const ACCENT: RGB = [37, 47, 87];
const TEXT_DARK: RGB = [31, 31, 31];
const TEXT_MUTED: RGB = [107, 114, 128];
const BORDER: RGB = [225, 227, 232];
const HEAD_BG: RGB = [244, 245, 249];
const GREEN: RGB = [22, 130, 90];

// ── Helpers ───────────────────────────────────────────────────
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

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
}

function rupeesInWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (crore) parts.push(`${rupeesInWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

function amountInWords(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const ps = paise % 100;
  return (
    `Indian Rupees ${rupeesInWords(rupees)}` +
    (ps ? ` and ${twoDigits(ps)} Paise` : "") +
    " Only"
  );
}

function resolveLogoPath(): string | null {
  if (!COMPANY_LOGO_PATH) return null;
  const normalized = COMPANY_LOGO_PATH.replace(/\\/g, "/");
  const candidates: string[] = [normalized];
  if (!isAbsolute(normalized)) {
    candidates.push(join(process.cwd(), normalized));
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
      dir = dirname(dir);
      candidates.push(join(dir, normalized));
      candidates.push(join(dir, "public", basename(normalized)));
    }
    candidates.push(join("/app", normalized));
    candidates.push(join("/app/public", basename(normalized)));
  }
  for (const c of candidates) {
    try {
      readFileSync(c);
      return c;
    } catch {
      continue;
    }
  }
  console.warn(
    `[invoice] Logo not found at COMPANY_LOGO_PATH="${COMPANY_LOGO_PATH}" (tried ${candidates[0]}). Place a PNG/JPG there or fix the path.`,
  );
  return null;
}

function loadLogo(): { data: string; format: "PNG" | "JPEG" } | null {
  if (!COMPANY_LOGO_PATH) return null;
  if (/\.svg$/i.test(COMPANY_LOGO_PATH)) {
    console.warn(
      "[invoice] COMPANY_LOGO_PATH points to an SVG — jsPDF cannot rasterize SVG. Export it as PNG/JPG first.",
    );
    return null;
  }
  const resolved = resolveLogoPath();
  if (!resolved) return null;
  try {
    const buf = readFileSync(resolved);
    if (buf.length > 500 * 1024) {
      console.warn(
        `[invoice] Logo is ${(buf.length / 1024).toFixed(0)}KB — keep it under 500KB (wide PNG/JPG) or every invoice PDF carries the extra weight.`,
      );
    }
    const isJpg = /\.jpe?g$/i.test(COMPANY_LOGO_PATH);
    const isPng = /\.png$/i.test(COMPANY_LOGO_PATH);
    if (!isJpg && !isPng) {
      console.warn(
        "[invoice] Logo must be a PNG or JPG file — skipping letterhead image.",
      );
      return null;
    }
    return {
      data: `data:image/${isJpg ? "jpeg" : "png"};base64,${buf.toString("base64")}`,
      format: isJpg ? "JPEG" : "PNG",
    };
  } catch {
    return null; // missing logo should never break invoice generation
  }
}

// ── Generator ─────────────────────────────────────────────────
export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const right = pageWidth - margin;
  const footerReserve = 22;

  const rate = data.taxRate && data.taxRate > 0 ? data.taxRate : 0;
  const inclusive = data.taxInclusive !== false;

  // ---- Amounts (all integers, paise) ----
  const items: InvoiceLineItem[] = data.items?.length
    ? data.items
    : [
        {
          name: data.packageName,
          description: data.packageDescription,
          amount: data.amount,
          quantity: 1,
        },
      ];

  const listedTotal = items.reduce(
    (s, i) => s + i.amount * (i.quantity ?? 1),
    0,
  );
  const discount = Math.min(data.discountAmount || 0, listedTotal);
  const toExcl = (p: number) =>
    inclusive && rate ? Math.round((p * 100) / (100 + rate)) : p;

  const lineExcl = (i: InvoiceLineItem) => toExcl(i.amount);
  const subtotalExcl = items.reduce(
    (s, i) => s + lineExcl(i) * (i.quantity ?? 1),
    0,
  );
  const discountExcl = toExcl(discount);
  const taxable = subtotalExcl - discountExcl;

  let taxTotal = 0;
  let grandTotal = 0;
  if (!rate) {
    grandTotal = listedTotal - discount;
  } else if (inclusive) {
    grandTotal = listedTotal - discount; // what the customer actually paid
    taxTotal = grandTotal - taxable;
  } else {
    taxTotal = Math.round((taxable * rate) / 100);
    grandTotal = taxable + taxTotal;
  }

  // CGST+SGST when seller and buyer are in the same state, IGST otherwise
  const sameState =
    !!COMPANY_STATE &&
    !!data.userState &&
    COMPANY_STATE.trim().toLowerCase() === data.userState.trim().toLowerCase();
  const knowsStates = !!COMPANY_STATE && !!data.userState;
  const taxLines: { label: string; amount: number }[] = [];
  if (rate) {
    if (knowsStates && sameState) {
      const cgst = Math.floor(taxTotal / 2);
      taxLines.push({ label: `CGST (${rate / 2}%)`, amount: cgst });
      taxLines.push({ label: `SGST (${rate / 2}%)`, amount: taxTotal - cgst });
    } else if (knowsStates) {
      taxLines.push({ label: `IGST (${rate}%)`, amount: taxTotal });
    } else {
      taxLines.push({ label: `GST (${rate}%)`, amount: taxTotal });
    }
  }

  // ---- Small drawing helpers ----
  const setText = (
    size: number,
    color: RGB,
    weight: "normal" | "bold" = "normal",
  ) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  // Draw wrapped text, return the y after the last line
  const paragraph = (
    text: string,
    x: number,
    y: number,
    width: number,
    lineH: number,
  ): number => {
    const lines: string[] = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * lineH;
  };

  const pair = (
    label: string,
    value: string,
    y: number,
    labelX: number,
    valueColor: RGB = TEXT_DARK,
    valueWeight: "normal" | "bold" = "normal",
  ) => {
    setText(9, TEXT_MUTED);
    doc.text(label, labelX, y);
    setText(9, valueColor, valueWeight);
    doc.text(value, right, y, { align: "right" });
  };

  let y = margin;

  // ── Letterhead: logo left + name beside it, name always ──
  // Name prints regardless so a missing/unreadable logo file can never
  // leave a blank header. Side-by-side keeps wide and square marks legible.
  const LOGO_H = 14;
  const LOGO_W_MAX = 52;
  let leftY = y;
  let logoW = 0;
  let logoH = 0;
  const logo = loadLogo();
  if (logo) {
    try {
      const p = doc.getImageProperties(logo.data);
      const aspect = p.width / p.height;
      logoW = Math.min(LOGO_W_MAX, LOGO_H * aspect);
      logoH = logoW / aspect;
      doc.addImage(logo.data, logo.format, margin, y - 1, logoW, logoH);
    } catch {
      logoW = 0;
      logoH = 0;
    }
  }
  setText(16, TEXT_DARK, "bold");
  if (logoW > 0) {
    doc.text(DISPLAY_NAME, margin + logoW + 4, y + logoH / 2 + 3);
    leftY = y + Math.max(logoH, 10) + 5;
  } else {
    doc.text(DISPLAY_NAME, margin, y + 5);
    leftY = y + 10;
  }

  // ── Invoice title + meta (right) ────────────────────────────
  setText(22, ACCENT, "bold");
  doc.text("Invoice", right, y + 6, {
    align: "right",
  });

  const metaLabelX = right - 64;
  let rightY = y + 14;
  pair("Invoice no.", data.invoiceNumber, rightY, metaLabelX);
  rightY += 5;
  pair("Invoice date", formatDate(data.date), rightY, metaLabelX);
  rightY += 5;
  if (data.dueDate) {
    pair("Due date", formatDate(data.dueDate), rightY, metaLabelX);
    rightY += 5;
  }
  if (data.orderId) {
    pair("Order ID", data.orderId, rightY, metaLabelX);
    rightY += 5;
  }

  y = Math.max(leftY, rightY) + 4;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, y, right, y);
  y += 7;

  // ── Billed to (left) + Payment details (right) ──────────────
  const leftWidth = contentWidth * 0.52;
  let billY = y;
  setText(8.5, TEXT_MUTED, "bold");
  doc.text("Billed to", margin, billY);
  billY += 6;
  setText(11, TEXT_DARK, "bold");
  doc.text(data.userName, margin, billY);
  billY += 5.5;
  setText(9.5, TEXT_MUTED);
  doc.text(data.userEmail, margin, billY);
  billY += 4.8;
  if (data.userPhone) {
    doc.text(data.userPhone, margin, billY);
    billY += 4.8;
  }
  if (data.userAddress)
    billY = paragraph(data.userAddress, margin, billY, leftWidth, 4.6);
  if (data.userState) {
    doc.text(`Place of supply: ${data.userState}`, margin, billY);
    billY += 4.8;
  }
  if (data.userGstin) {
    doc.text(`GSTIN: ${data.userGstin}`, margin, billY);
    billY += 4.8;
  }

  let payY = y;
  setText(8.5, TEXT_MUTED, "bold");
  doc.text("Payment details", metaLabelX, payY);
  payY += 6;
  if (data.paymentStatus) {
    const color: RGB =
      data.paymentStatus === "PAID"
        ? GREEN
        : data.paymentStatus === "PENDING"
          ? [180, 130, 20]
          : [150, 60, 60];
    const label =
      data.paymentStatus.charAt(0) + data.paymentStatus.slice(1).toLowerCase();
    pair("Status", label, payY, metaLabelX, color, "bold");
    payY += 5;
  }
  if (data.paymentMethod) {
    pair("Method", data.paymentMethod, payY, metaLabelX);
    payY += 5;
  }
  if (data.transactionId) {
    pair("Transaction ID", data.transactionId, payY, metaLabelX);
    payY += 5;
  }
  if (data.paidOn) {
    pair("Paid on", formatDate(data.paidOn), payY, metaLabelX);
    payY += 5;
  }

  y = Math.max(billY, payY) + 5;

  // ── Line items ──────────────────────────────────────────────
  const showSac = !!COMPANY_SAC || items.some((i) => i.sac);
  const priceHead = rate && inclusive ? "Unit price (excl. GST)" : "Unit price";

  const R = (content: string) => ({
    content,
    styles: { halign: "right" as const },
  });
  const head = [
    "Description",
    ...(showSac ? ["SAC"] : []),
    R("Qty"),
    R(priceHead),
    R("Amount"),
  ];
  const body = items.map((i) => {
    const qty = i.quantity ?? 1;
    return [
      i.description ? `${i.name}\n${i.description}` : i.name,
      ...(showSac ? [i.sac || COMPANY_SAC || "-"] : []),
      String(qty),
      formatPrice(lineExcl(i)),
      formatPrice(lineExcl(i) * qty),
    ];
  });

  const colStyles: Record<
    number,
    { halign: "right" | "left"; cellWidth?: number }
  > = {};
  const base = showSac ? 1 : 0;
  if (showSac) colStyles[1] = { halign: "left", cellWidth: 20 };
  colStyles[1 + base] = { halign: "right", cellWidth: 14 };
  colStyles[2 + base] = {
    halign: "right",
    cellWidth: rate && inclusive ? 38 : 32,
  };
  colStyles[3 + base] = { halign: "right", cellWidth: 32 };

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: footerReserve },
    head: [head],
    body,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: TEXT_DARK,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      valign: "top",
    },
    headStyles: {
      fillColor: HEAD_BG,
      textColor: TEXT_MUTED,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    columnStyles: colStyles,
    didDrawCell: (h) => {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(
        h.cell.x,
        h.cell.y + h.cell.height,
        h.cell.x + h.cell.width,
        h.cell.y + h.cell.height,
      );
    },
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;

  // ── Totals (right) + amount in words (left) ─────────────────
  const totalRows =
    1 +
    (discount > 0 ? 1 : 0) +
    taxLines.length +
    1 +
    (data.paymentStatus === "PAID" ? 1 : 0);
  const totalsHeight = totalRows * 6 + 16;
  if (y + totalsHeight > pageHeight - footerReserve) {
    doc.addPage();
    y = margin;
  }

  const totalsTop = y;
  const labelX = right - 70;

  let ty = y;
  pair("Subtotal", formatPrice(subtotalExcl), ty, labelX);
  ty += 6;
  if (discount > 0) {
    pair(
      data.couponCode ? `Discount (${data.couponCode})` : "Discount",
      `- ${formatPrice(discountExcl)}`,
      ty,
      labelX,
      GREEN,
    );
    ty += 6;
  }
  for (const t of taxLines) {
    pair(t.label, formatPrice(t.amount), ty, labelX);
    ty += 6;
  }

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(labelX - 2, ty - 3, right, ty - 3);
  ty += 2;
  setText(12, ACCENT, "bold");
  doc.text("Total", labelX, ty);
  doc.text(formatPrice(grandTotal), right, ty, { align: "right" });
  ty += 7;
  if (data.paymentStatus === "PAID") {
    pair("Amount paid", formatPrice(grandTotal), ty, labelX, GREEN, "bold");
    ty += 6;
  }

  // Amount in words
  setText(8.5, TEXT_MUTED, "bold");
  doc.text("Amount in words", margin, totalsTop);
  setText(9.5, TEXT_DARK);
  const wordsEnd = paragraph(
    amountInWords(grandTotal),
    margin,
    totalsTop + 5.5,
    labelX - margin - 10,
    4.6,
  );

  y = Math.max(ty, wordsEnd) + 6;

  // ── Notes ───────────────────────────────────────────────────
  const notes: string[] = [];
  if (rate) notes.push("Reverse charge applicable: No");
  if (rate && inclusive) notes.push("All listed prices are inclusive of GST.");
  if (INVOICE_NOTE) notes.push(INVOICE_NOTE);
  if (notes.length) {
    const noteHeight = 6 + notes.length * 4.5;
    if (y + noteHeight > pageHeight - footerReserve) {
      doc.addPage();
      y = margin;
    }
    setText(8.5, TEXT_MUTED, "bold");
    doc.text("Notes", margin, y);
    setText(8.5, TEXT_MUTED);
    y += 5;
    for (const n of notes) y = paragraph(n, margin, y, contentWidth, 4.2);
  }

  // ── Footer on every page ────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const fy = pageHeight - 16;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, fy, right, fy);
    setText(8, TEXT_MUTED);
    doc.text(
      "This is a computer-generated invoice and does not require a signature.",
      margin,
      fy + 5,
    );
    doc.text(`Page ${p} of ${pages}`, right, fy + 5, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
