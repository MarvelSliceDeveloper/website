import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

export interface PublishChecklistItem {
  item: string;
  passed: boolean;
}

interface PublishChecklistModalProps {
  checklist: PublishChecklistItem[] | null;
  onClose: () => void;
}

/**
 * Extracts the publish-requirements checklist from a failed publish
 * request. The API answers HTTP 422 with `{ error, checklist }`, which
 * `api.post` surfaces as a thrown error carrying `response.data`.
 * Returns null when the error carries no checklist.
 */
export function extractPublishChecklist(
  err: unknown,
): PublishChecklistItem[] | null {
  if (typeof err !== "object" || err === null) return null;
  const response =
    (err as { response?: unknown }).response ?? (err as { data?: unknown });
  const data =
    typeof response === "object" && response !== null
      ? ((response as { data?: unknown }).data ?? response)
      : null;
  if (typeof data !== "object" || data === null) return null;
  const checklist = (data as { checklist?: unknown }).checklist;
  if (!Array.isArray(checklist)) return null;
  const items = checklist.filter(
    (c): c is PublishChecklistItem =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as { item?: unknown }).item === "string" &&
      typeof (c as { passed?: unknown }).passed === "boolean",
  );
  return items.length > 0 ? items : null;
}

export default function PublishChecklistModal({
  checklist,
  onClose,
}: PublishChecklistModalProps) {
  const unmetCount = (checklist ?? []).filter((c) => !c.passed).length;

  return (
    <Dialog
      open={checklist !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cannot publish yet</DialogTitle>
          <DialogDescription>
            {unmetCount > 0
              ? `${unmetCount} requirement${unmetCount === 1 ? "" : "s"} still need${unmetCount === 1 ? "s" : ""} attention before this course can go live.`
              : "Review the publish requirements below."}
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5">
          {(checklist ?? []).map((c) => (
            <li
              key={c.item}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                c.passed
                  ? "border-emerald-500/25 bg-emerald-500/5 text-foreground"
                  : "border-rose-500/30 bg-rose-500/5 font-medium text-foreground"
              }`}
            >
              {c.passed ? (
                <IconCircleCheck
                  size={18}
                  stroke={2}
                  className="mt-0.5 shrink-0 text-emerald-600"
                  aria-label="Requirement met"
                />
              ) : (
                <IconCircleX
                  size={18}
                  stroke={2}
                  className="mt-0.5 shrink-0 text-rose-600"
                  aria-label="Requirement not met"
                />
              )}
              <span>{c.item}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
