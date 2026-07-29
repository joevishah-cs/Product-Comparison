import { FileSpreadsheet, FileText, CircleSlash } from "lucide-react";
import { cn, UNAVAILABLE } from "@/lib/utils";
import { Explain } from "@/components/ui/tooltip";
import type { AttributeValue } from "@/data/types";
import { DOC_BATTLECARD } from "@/data/catalog";

export function SourceIcon({ documentId, className }: { documentId: string; className?: string }) {
  const Icon = documentId === DOC_BATTLECARD ? FileText : FileSpreadsheet;
  return <Icon className={cn("size-3.5", className)} aria-hidden />;
}

/** Small inline citation. Every factual number in the app carries one. */
export function Citation({
  value,
  className,
  compact = false,
}: {
  value: AttributeValue | { source: { citation: string; documentId: string } };
  className?: string;
  compact?: boolean;
}) {
  const { citation, documentId } = value.source;
  const short = citation.split(" · ")[0];
  return (
    <Explain content={<span className="break-words">{citation}</span>}>
      <span
        tabIndex={0}
        role="note"
        aria-label={`Source: ${citation}`}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-md text-xs font-medium text-navy-400 transition-colors hover:text-daikin-700",
          className,
        )}
      >
        <SourceIcon documentId={documentId} />
        <span className="truncate">{compact ? short : citation}</span>
      </span>
    </Explain>
  );
}

/** Renders a source value, or the required "Information unavailable" wording. */
export function ValueText({
  value,
  className,
  emphasis = false,
}: {
  value: AttributeValue | undefined;
  className?: string;
  emphasis?: boolean;
}) {
  if (!value || value.status !== "verified") {
    const reason =
      value?.status === "formula_error"
        ? `The source cell contains a spreadsheet error (${value.raw ?? "#VALUE!"}), so it is excluded from verified values.`
        : "The source document leaves this cell blank. A blank is not a “No” — it means the value was never recorded.";
    return (
      <Explain content={reason}>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md text-navy-400",
            emphasis ? "text-base font-medium" : "text-sm",
            className,
          )}
        >
          <CircleSlash className="size-3.5 shrink-0" aria-hidden />
          {UNAVAILABLE}
        </span>
      </Explain>
    );
  }
  return (
    <span className={cn(emphasis ? "text-base font-semibold text-navy-900" : "text-sm text-navy-800", className)}>
      {value.display}
    </span>
  );
}

export function SourceAssessmentNote({ value }: { value: AttributeValue }) {
  if (!value.sourceAssessment) return null;
  const map: Record<string, string> = {
    daikin_better: "The battlecard shades this cell green — its own legend reads “Daikin better”.",
    competitor_better: "The battlecard shades this cell red — its own legend reads “Comp. better”.",
    not_available_marker: "The battlecard shades this cell as information not available.",
    equal_or_no_difference: "The battlecard leaves this cell unshaded — “equal or no significant difference”.",
  };
  const text = map[value.sourceAssessment];
  if (!text) return null;
  return (
    <Explain content={`${text} This is the source author's own qualitative mark, shown as presentation evidence only — it is not a calculated result.`}>
      <span
        tabIndex={0}
        className={cn(
          "inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset",
          value.sourceAssessment === "daikin_better" && "bg-verified-500/70 ring-verified-600/40",
          value.sourceAssessment === "competitor_better" && "bg-risk-500/60 ring-risk-600/40",
          value.sourceAssessment === "not_available_marker" && "bg-caution-500/50 ring-caution-600/40",
        )}
        aria-label="Source document colour mark"
      />
    </Explain>
  );
}
