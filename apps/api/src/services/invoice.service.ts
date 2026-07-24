import { jsPDF } from "jspdf";

interface InvoiceData {
  invoiceNumber: string;
  userName: string;
  userEmail: string;
  packageName: string;
  amount: number;
  discountAmount: number;
  date: Date;
  password?: string;
}

const COMPANY_NAME = process.env.EMAIL_FROM_NAME || "LMS Portal";

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  let y = margin;

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(COMPANY_NAME, pageWidth / 2, 26, { align: "center" });

  y = 56;

  doc.setTextColor(79, 70, 229);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("INVOICE", pageWidth / 2, y, { align: "center" });

  y += 6;

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoiceNumber}`, margin, y);
  const dateStr = data.date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Date: ${dateStr}`, margin, y + 5);

  y += 18;

  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 2, pageWidth - 2 * margin, 22, "F");

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To:", margin + 3, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(data.userName, margin + 3, y + 10);
  doc.text(data.userEmail, margin + 3, y + 16);

  y += 30;

  doc.setFillColor(79, 70, 229);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Description", margin + 3, y + 6);
  doc.text("Amount", pageWidth - margin - 3, y + 6, { align: "right" });

  y += 12;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);

  doc.setTextColor(55, 65, 81);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.packageName, margin + 3, y + 3);
  doc.text(formatPrice(data.amount), pageWidth - margin - 3, y + 3, {
    align: "right",
  });
  doc.line(margin, y + 8, pageWidth - margin, y + 8);
  y += 12;

  if (data.discountAmount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Discount", margin + 3, y + 3);
    doc.text(
      `-${formatPrice(data.discountAmount)}`,
      pageWidth - margin - 3,
      y + 3,
      { align: "right" },
    );
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);
    y += 12;
  }

  const netAmount = data.amount - data.discountAmount;

  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 2, pageWidth - 2 * margin, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Total Paid", margin + 3, y + 5);
  doc.text(formatPrice(netAmount), pageWidth - margin - 3, y + 5, {
    align: "right",
  });

  y += 18;

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  if (data.password) {
    doc.setFillColor(240, 253, 244);
    doc.rect(margin, y, pageWidth - 2 * margin, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text("Your Login Credentials", margin + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`Email: ${data.userEmail}`, margin + 3, y + 12);
    doc.text(`Password: ${data.password}`, margin + 3, y + 18);
    y += 32;
  }

  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Thank you for your purchase!",
    pageWidth / 2,
    pageHeight - margin - 10,
    { align: "center" },
  );

  return Buffer.from(doc.output("arraybuffer"));
}
