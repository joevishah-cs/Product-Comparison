import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-12 w-full rounded-xl border border-edge bg-white px-4 text-base text-navy-900 shadow-sm transition-colors",
        "placeholder:text-navy-400 focus-visible:border-daikin-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daikin-500/30",
        "disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[112px] w-full rounded-xl border border-edge bg-white px-4 py-3 text-base text-navy-900 shadow-sm transition-colors",
      "placeholder:text-navy-400 focus-visible:border-daikin-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daikin-500/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("block text-sm font-semibold text-navy-700", className)} {...props} />
  ),
);
Label.displayName = "Label";
