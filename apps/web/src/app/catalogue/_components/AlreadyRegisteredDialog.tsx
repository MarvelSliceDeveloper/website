"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { IconAlertCircle, IconArrowRight, IconLogin } from "@tabler/icons-react";

interface AlreadyRegisteredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export default function AlreadyRegisteredDialog({
  open,
  onOpenChange,
  email,
}: AlreadyRegisteredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <IconAlertCircle size={18} />
            </span>
            <DialogTitle className="text-base">Already registered</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            <span className="font-semibold text-foreground">{email}</span> is
            already registered with Marvel Slice. Please log in to continue
            your purchase — you won&apos;t be charged twice for the same
            package.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 cursor-pointer"
          >
            Continue as guest
          </button>
          <Link
            href={`/login?redirect=/catalogue&email=${encodeURIComponent(email)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <IconLogin size={15} />
            Log in
            <IconArrowRight size={14} />
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
