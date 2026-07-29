import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daikin-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-daikin-600 text-white shadow-sm hover:bg-daikin-700 active:bg-daikin-800",
        secondary: "bg-white text-navy-800 border border-edge shadow-sm hover:bg-navy-50 hover:border-navy-200",
        ghost: "text-navy-700 hover:bg-navy-100/70",
        subtle: "bg-navy-100/70 text-navy-800 hover:bg-navy-200/70",
        verified: "bg-verified-600 text-white hover:bg-verified-700",
        danger: "bg-risk-600 text-white hover:bg-risk-700",
        outlineDanger: "border border-risk-500/40 text-risk-600 hover:bg-risk-50",
        link: "text-daikin-700 underline underline-offset-4 hover:text-daikin-800",
      },
      size: {
        sm: "h-10 px-3.5 text-sm [&_svg]:size-4",
        md: "h-11 px-4 text-base [&_svg]:size-[18px]",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        xl: "h-14 px-7 text-lg [&_svg]:size-5",
        icon: "h-11 w-11 [&_svg]:size-5",
        iconSm: "h-10 w-10 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
