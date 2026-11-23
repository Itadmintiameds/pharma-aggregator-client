"use client";

import Products from "../dashboard/components/Products";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/src/types/seller/dashboard";
import ProductList, {
  categoryMap,
  CategoryFilter,
  StockFilter,
  StatusFilter,
} from "../dashboard/components/ProductList";
import { OnboardingModal } from "../dashboard/components/DashboardFilters";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { useClickOutside } from "@/src/hooks/useClickOutside";

const STOCK_LABELS: Record<StockFilter, string> = {
  all: "All Stocks",
  in: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All Status",
  draft: "Draft",
  published: "Published",
  unpublished: "Unpublished",
};

interface FilterOption {
  value: string;
  label: string;
}

// One compact filter dropdown (replaces three copy-pasted ones). Each instance closes itself on an outside click,
// so opening another filter closes this one.
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  widthClass = "w-36",
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className={`relative shrink-0 ${widthClass}`} ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={current}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 text-[13px] font-semibold text-pneutral-900 transition-colors hover:border-primary-800 ${
          open ? "border-primary-800 ring-2 ring-primary-100" : "border-pneutral-200"
        }`}
      >
        <span className="truncate">{current}</span>
        <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-10 z-20 max-h-72 w-full min-w-44 overflow-y-auto rounded-lg border border-pneutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-neutral-100 ${
                  selected ? "bg-primary-50 font-semibold text-primary-900" : "text-pneutral-900"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check size={14} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ProductsProps {
  setCurrentView: (view: DashboardView) => void;
  // setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ProductsPage({ setCurrentView }: ProductsProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [allowedCategoryIds, setAllowedCategoryIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchSellerCategories = async () => {
      try {
        const profile = await sellerProfileService.getCurrentSellerProfile();
        setAllowedCategoryIds(
          profile.productTypes.map((pt) => pt.productTypeId),
        );
      } catch (error) {
        console.error("Error fetching seller product categories:", error);
        setAllowedCategoryIds([]);
      }
    };
    fetchSellerCategories();
  }, []);

  const availableCategoryEntries = Object.entries(categoryMap).filter(
    ([id]) => allowedCategoryIds.includes(Number(id)),
  );

  const handleSetCurrentView = (view: DashboardView) => {
    if (view === "addProduct") {
      router.push("/seller_7a3b9f2c/products/add");
    } else if (view === "productView") {
      router.push(`/seller_7a3b9f2c/products/view/${selectedProductId}`);
    } else if (
      view === "editDrug" ||
      view === "editConsumable" ||
      view === "editNonConsumable" ||
      view === "editSupplement" ||
      view === "editFoodInfant" ||
      view === "editCosmetic"
    ) {
      router.push(
        `/seller_7a3b9f2c/products/edit/${selectedProductId}?category=${view}`,
      );
    }
  };

  return (
    <>
      <div className="space-y-2">
        <ProductList
          setCurrentView={setCurrentView}
          setSelectedProductId={setSelectedProductId}
          categoryFilter={categoryFilter}
          stockFilter={stockFilter}
          statusFilter={statusFilter}
          filtersSlot={
            <>
      <FilterDropdown
        label="Filter by stock"
        value={stockFilter}
        options={(Object.keys(STOCK_LABELS) as StockFilter[]).map((key) => ({ value: key, label: STOCK_LABELS[key] }))}
        onChange={(v) => setStockFilter(v as StockFilter)}
      />
      <FilterDropdown
        label="Filter by status"
        value={statusFilter}
        options={(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => ({ value: key, label: STATUS_LABELS[key] }))}
        onChange={(v) => setStatusFilter(v as StatusFilter)}
      />
      <FilterDropdown
        label="Filter by category"
        widthClass="w-56"
        value={String(categoryFilter)}
        options={[
          { value: "all", label: "All Categories" },
          ...availableCategoryEntries.map(([id, name]) => ({ value: id, label: name })),
        ]}
        onChange={(v) => setCategoryFilter(v === "all" ? "all" : Number(v))}
      />
            </>
          }
          actionSlot={
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-primary-900 bg-transparent px-3.5 text-[13px] font-semibold text-primary-900 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2"
      >
        <Plus size={15} aria-hidden />
        <span>Add New Product</span>
      </button>
          }
        />
      </div>

      {showAddModal && (
        <OnboardingModal
          onClose={() => setShowAddModal(false)}
          onManualEntry={() => {
            setShowAddModal(false);
            router.push("/seller_7a3b9f2c/products/add");
          }}
        />
      )}
    </>
  );
}
