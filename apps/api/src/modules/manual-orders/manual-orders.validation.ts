import { AppError } from "../../utils/errors";

/** Normalize + validate a UTR / UPI reference. Stored uppercase. */
export function normalizeUtr(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^([0-9]{12}|[A-Z0-9]{12,22})$/.test(v)) {
    throw new AppError(400, "Invalid transaction / UTR ID");
  }
  return v;
}

/** Validate a UPI VPA like `name@okhdfc`. */
export function validateUpiId(upiId: string): void {
  if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
    throw new AppError(400, "Invalid UPI ID");
  }
}

/** Build a `upi://pay` intent string for QR rendering. */
export function buildUpiIntent(args: {
  upiId: string;
  payeeName: string;
  amountPaise: number;
  note: string;
}): string {
  const amt = (args.amountPaise / 100).toFixed(2);
  return (
    `upi://pay?pa=${encodeURIComponent(args.upiId)}` +
    `&pn=${encodeURIComponent(args.payeeName)}` +
    `&am=${amt}&cu=INR` +
    `&tn=${encodeURIComponent(args.note.slice(0, 80))}`
  );
}
