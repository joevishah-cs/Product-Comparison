import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-navy-100 text-navy-700",
        daikin: "bg-daikin-50 text-daikin-800 ring-1 ring-inset ring-daikin-200",
        verified: "bg-verified-50 text-verified-700 ring-1 ring-inset ring-verified-500/25",
        caution: "bg-caution-50 text-caution-700 ring-1 ring-inset ring-caution-500/25",
        risk: "bg-risk-50 text-risk-700 ring-1 ring-inset ring-risk-500/25",
        outline: "bg-white text-navy-600 ring-1 ring-inset ring-edge",
      },
      size: {
        sm: "px-2 py-0.5 text-xs [&_svg]:size-3",
        md: "px-2.5 py-1 text-sm [&_svg]:size-3.5",
        lg: "px-3 py-1.5 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, size, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);

export { badgeVariants };
