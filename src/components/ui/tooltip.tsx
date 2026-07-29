import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        "z-[80] max-w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-navy-900 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-pop",
        "animate-scale-in",
        className,
      )}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className="fill-navy-900" width={12} height={6} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/** Icon-only trigger that explains an HVAC term in homeowner-friendly language. */
export function InfoTip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`What does ${label} mean?`}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-100 hover:text-daikin-700",
            className,
          )}
        >
          <HelpCircle className="size-[18px]" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="block text-xs font-bold uppercase tracking-wider text-daikin-300">{label}</span>
        <span className="mt-1 block">{children}</span>
      </TooltipContent>
    </TooltipRoot>
  );
}

/** Wraps arbitrary content with an explanatory tooltip. */
export function Explain({
  content,
  children,
  asChild = true,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  );
}
