"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Baby, ChevronDown, ChevronRight, LayoutGrid, Package, Pill, Sparkles, Sprout, Stethoscope, LucideIcon } from "lucide-react";
import {
  getConsumableDeviceCategories,
  getNonConsumableDeviceCategories,
} from "@/src/services/product/ProductService";
import { getTherapeuticCategory } from "@/src/services/product/TherapeuticCategoryService";
import { getProductCategories as getFoodInfantProductCategories } from "@/src/services/product/FoodInfantService";
import { getCosmeticProductTypes } from "@/src/services/product/CosmeticService";
import { STOREFRONT_CATEGORIES } from "@/src/utils/storefrontCategories";

interface SubCategory {
  id: string | number;
  name: string;
}

const CATEGORY_ICONS: Record<number, LucideIcon> = {
  1: Pill,
  2: Sprout,
  3: Baby,
  4: Sparkles,
  5: Package,
  6: Stethoscope,
};

const toSubCategories = (raw: unknown, idKey: string, nameKey: string): SubCategory[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const record = entry as Record<string, unknown>;
      return { id: record[idKey] as string | number, name: record[nameKey] as string };
    })
    .filter((s) => s.name);
};

async function fetchSubCategories(parentId: number): Promise<SubCategory[]> {
  switch (parentId) {
    case 1:
    case 2:
      return toSubCategories(await getTherapeuticCategory(parentId), "therapeuticCategoryId", "therapeuticCategory");
    case 3:
      return toSubCategories(await getFoodInfantProductCategories(3), "productCategoryId", "productCategory");
    case 4:
      return toSubCategories(await getCosmeticProductTypes(), "id", "name");
    case 5:
      return toSubCategories(await getConsumableDeviceCategories(), "deviceCatId", "deviceName");
    case 6:
      return toSubCategories(await getNonConsumableDeviceCategories(), "deviceCatId", "deviceName");
    default:
      return [];
  }
}

/** Where a subcategory goes on the results page. Drugs/supplements filter by therapeutic area; the rest by text. */
function subCategoryHref(parentId: number, sub: SubCategory): string {
  const name = encodeURIComponent(sub.name);
  if (parentId === 1 || parentId === 2) return `/search?categoryId=${parentId}&therapeuticCategory=${name}`;
  return `/search?categoryId=${parentId}&q=${name}`;
}

/**
 * "All Categories" mega-menu for the header: one panel with the storefront's 6 top-level categories on the left and
 * the subcategories of the active one in a grid on the right (the first category is active when it opens).
 * Opens on click, closes on outside click or Escape. Below `md` only the category list shows.
 */
export default function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number>(STOREFRONT_CATEGORIES[0].id);
  const [cache, setCache] = useState<Record<number, SubCategory[]>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const requested = useRef<Set<number>>(new Set());

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const activate = (id: number) => {
    setActiveId(id);
    if (requested.current.has(id)) return;
    requested.current.add(id);
    setLoadingId(id);
    fetchSubCategories(id)
      .catch(() => [] as SubCategory[])
      .then((items) => setCache((prev) => ({ ...prev, [id]: items })))
      .finally(() => setLoadingId((prev) => (prev === id ? null : prev)));
  };

  const toggle = () => {
    if (!open) activate(activeId); // the right-hand panel is never empty on open
    setOpen((o) => !o);
  };

  const active = STOREFRONT_CATEGORIES.find((c) => c.id === activeId) ?? STOREFRONT_CATEGORIES[0];
  const subs = cache[active.id];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
          open ? "bg-primary-900 text-white" : "bg-primary-50 text-primary-900 hover:bg-primary-100"
        }`}
      >
        <LayoutGrid size={16} aria-hidden="true" />
        <span className="hidden sm:inline">All Categories</span>
        <span className="sm:hidden">Categories</span>
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-2 flex w-[min(92vw,20rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl md:w-[46rem]">
          {/* ---------------- categories ---------------- */}
          <div role="menu" aria-label="Product categories" className="flex w-full flex-col bg-gray-50 md:w-72 md:shrink-0 md:border-r md:border-gray-200">
            <ul className="flex-1 py-2">
              {STOREFRONT_CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] ?? Package;
                const isActive = activeId === category.id;
                return (
                  <li key={category.id} onMouseEnter={() => activate(category.id)}>
                    <Link
                      href={`/search?categoryId=${category.id}`}
                      role="menuitem"
                      onClick={close}
                      onFocus={() => activate(category.id)}
                      className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive ? "bg-white font-semibold text-primary-900 shadow-sm ring-1 ring-primary-100" : "text-gray-700 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? "bg-primary-900 text-white" : "bg-white text-primary-800 ring-1 ring-gray-200"
                        }`}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{category.name}</span>
                      <ChevronRight size={14} aria-hidden="true" className={`shrink-0 ${isActive ? "text-primary-800" : "text-gray-400"}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/search?sort=newest"
              onClick={close}
              className="border-t border-gray-200 px-5 py-3 text-sm font-semibold text-primary-800 no-underline hover:bg-white hover:no-underline"
            >
              View all products
            </Link>
          </div>

          {/* ---------------- subcategories (md and up) ---------------- */}
          <div className="hidden min-w-0 flex-1 flex-col md:flex">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
              <h3 className="truncate text-base font-semibold text-gray-900">{active.name}</h3>
              <Link
                href={`/search?categoryId=${active.id}`}
                onClick={close}
                className="shrink-0 text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 hover:no-underline"
              >
                View all
              </Link>
            </div>
            <div className="max-h-[22rem] flex-1 overflow-y-auto px-4 py-3">
              {loadingId === active.id && !subs && <p className="px-2 py-2 text-sm text-gray-400">Loading…</p>}
              {subs?.length === 0 && <p className="px-2 py-2 text-sm text-gray-400">No subcategories yet</p>}
              <ul className="grid grid-cols-2 gap-x-2">
                {subs?.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={subCategoryHref(active.id, sub)}
                      onClick={close}
                      className="block truncate rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-800"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
