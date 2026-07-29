import { cn } from "@/lib/utils";
import type { Product } from "@/data/types";
import { Explain } from "@/components/ui/tooltip";
import { photoFor } from "@/data/product-images";

const SIZE_CLASS = {
  xs: "h-12 w-16",
  sm: "h-16 w-[5.5rem]",
  md: "h-24 w-32",
  lg: "h-32 w-44",
  xl: "h-44 w-full",
} as const;

export function ProductVisual({
  product,
  size = "md",
  className,
  showRepresentativeLabel = false,
}: {
  product: Product;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  showRepresentativeLabel?: boolean;
}) {
  const photo = photoFor(product.id);
  const isPhoto = photo !== null;

  const img = (
    <img
      src={photo?.src ?? product.image}
      alt={
        isPhoto
          ? `${product.displayName} — ${photo.appliesTo}`
          : `${product.displayName} — representative ${product.equipmentTypeLabel.toLowerCase()} illustration`
      }
      loading="lazy"
      className={cn(
        "shrink-0 rounded-xl border",
        isPhoto ? "bg-white object-contain p-1" : "object-cover",
        product.isDaikin ? "border-daikin-200 bg-daikin-50" : "border-edge bg-navy-50",
        isPhoto && "bg-white",
        SIZE_CLASS[size],
        className,
      )}
    />
  );

  return (
    <div className="relative shrink-0">
      <Explain
        content={
          isPhoto ? (
            <>
              <span className="block text-xs font-bold uppercase tracking-wider text-daikin-300">
                Manufacturer product image
              </span>
              <span className="mt-1 block">
                {photo.appliesTo}. Image © {photo.credit}, used to identify the product being compared.
                Finish and configuration may vary by unit size and region.
              </span>
            </>
          ) : (
            <>
              <span className="block text-xs font-bold uppercase tracking-wider text-daikin-300">
                Representative image
              </span>
              <span className="mt-1 block">
                No manufacturer photograph has been supplied for this model, so a neutral illustration of a{" "}
                {product.chassis ? `${product.chassis} chassis ` : ""}
                {product.equipmentTypeLabel.toLowerCase()} is shown. It is not a picture of this specific
                model.
              </span>
            </>
          )
        }
      >
        {img}
      </Explain>
      {showRepresentativeLabel && (
        <span className="mt-1.5 block text-xs font-medium text-navy-400">
          {isPhoto ? `Image © ${photo.credit}` : "Representative image"}
        </span>
      )}
    </div>
  );
}
