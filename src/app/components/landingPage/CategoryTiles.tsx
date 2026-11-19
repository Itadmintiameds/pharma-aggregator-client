"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isRequestCancelled, searchProducts } from "@/src/services/buyer/searchService";

/**
 * Illustration for each top-level category, served from public/assets/categories/<slug>.png (see the README in that
 * folder for sizes). Keys are matched case-insensitively against the category's name; the first key contained in the
 * name wins, so "Consumable Medical Devices & Equipment" -> consumables.
 */
const ILLUSTRATIONS: { match: string; slug: string; label: string }[] = [
  { match: "non-consumable", slug: "equipment", label: "Equipment" },
  { match: "consumable", slug: "consumables", label: "Consumables" },
  { match: "cosmetic", slug: "cosmetics", label: "Personal Care" },
  { match: "supplement", slug: "supplements", label: "Supplements" },
  { match: "drug", slug: "drugs", label: "Pharma" },
];

function lookup(name: string) {
  const lower = name.toLowerCase();
  return ILLUSTRATIONS.find((i) => lower.includes(i.match));
}

function illustrationFor(name: string): string | undefined {
  const hit = lookup(name);
  return hit ? `/assets/categories/${hit.slug}.png` : undefined;
}

interface Category {
  name: string;
  id?: string;
  /** Real product photo from the category, used until/unless an illustration file exists. */
  photo?: string;
}

/**
 * "Shop by Category": the catalog's top-level categories (from the search facets), each with an illustration.
 * If the illustration file is missing it falls back to a real product photo from that category.
 */
export default function CategoryTiles() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    searchProducts({ page: 0, size: 100, sort: "newest" }, controller.signal)
      .then((result) => {
        const facet = result.facets.find((f) => f.field === "categoryName");
        const names = [...(facet?.values ?? [])].sort((a, b) => b.count - a.count).map((v) => v.value);
        // The filter API takes an id, the facet only has names - read the id (and a photo) off the products.
        setCategories(
          names.map((name) => {
            const sample = result.results.find((r) => r.categoryName === name);
            const withPhoto = result.results.find((r) => r.categoryName === name && r.imageUrl);
            return { name, id: sample?.categoryId ?? undefined, photo: withPhoto?.imageUrl ?? undefined };
          })
        );
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setCategories([]);
      });
    return () => controller.abort();
  }, []);

  if (categories.length === 0) return null;
  return (
    <section className="py-4">
      <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:text-2xl">Shop by Category</h2>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(112px,1fr))]">
        {categories.map((category) => (
          <Tile key={category.name} category={category} />
        ))}
      </div>
    </section>
  );
}

function Tile({ category }: { category: Category }) {
  const illustration = illustrationFor(category.name);
  // illustration -> product photo -> nothing (name only), advancing each time an image fails to load
  const sources = [illustration, category.photo].filter((s): s is string => Boolean(s));
  const [failed, setFailed] = useState(0);
  const src = sources[failed];
  const href = category.id
    ? `/search?categoryId=${encodeURIComponent(category.id)}`
    : `/search?q=${encodeURIComponent(category.name)}`;

  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 pb-2.5 pt-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-700 hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
            onError={() => setFailed((n) => n + 1)}
          />
        )}
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-snug text-primary-900">{lookup(category.name)?.label ?? category.name}</span>
    </Link>
  );
}
