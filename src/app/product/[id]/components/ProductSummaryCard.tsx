import { BuyerProduct } from "@/src/types/buyer/product";

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";

interface ProductSummaryCardProps {
  product: BuyerProduct;
}

export default function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  const image = product.productImages?.find((img) => img.productImage)?.productImage ?? PLACEHOLDER_IMAGE;
  const pricing = product.pricingDetails?.[0];
  const totalStock = product.pricingDetails?.reduce((sum, p) => sum + (p.stockQuantity ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 lg:sticky lg:top-24">
      <p className="text-label-l2 font-heading font-semibold text-pneutral-500 uppercase tracking-wide mb-4">
        Product
      </p>
      <div className="flex gap-4">
        <div className="w-20 h-20 shrink-0 rounded-lg bg-neutral-50 overflow-hidden">
          <img
            src={image}
            alt={product.productName}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-p3 font-heading font-medium text-pneutral-900 line-clamp-2">
            {product.productName}
          </p>
          {product.manufacturerName && (
            <p className="text-label-l2 font-body text-pneutral-500 mt-1">{product.manufacturerName}</p>
          )}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-neutral-100 space-y-3">
        {pricing?.sellingPrice != null && (
          <div className="flex items-center justify-between">
            <p className="text-p4 font-body text-pneutral-600">Listed price</p>
            <p className="text-p3 font-heading font-semibold text-primary-800">₹{pricing.sellingPrice}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-p4 font-body text-pneutral-600">Availability</p>
          <p className="text-p4 font-body text-pneutral-800">
            {totalStock != null ? (totalStock > 0 ? `${totalStock} in stock` : "Out of stock") : "—"}
          </p>
        </div>
        {product.hsnCode && (
          <div className="flex items-center justify-between">
            <p className="text-p4 font-body text-pneutral-600">HSN Code</p>
            <p className="text-p4 font-body text-pneutral-800">{product.hsnCode}</p>
          </div>
        )}
      </div>
    </div>
  );
}
