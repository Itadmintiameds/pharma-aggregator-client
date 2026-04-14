"use client";

import React, { useState, useRef, useEffect } from "react";
import { Edit, Eye, Trash2, SlidersHorizontal, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

const allProducts = new Array(6).fill(null).map((_, i) => ({
  name: "Paracetamol",
  category: "Drugs",
  price: "₹20",
  priceNum: 20,
  stock: 10000,
  status: "Active",
}));

type SortField = "name" | "price" | "stock" | "none";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { label: string; field: SortField; dir: SortDir }[] = [
  { label: "Name (A–Z)", field: "name", dir: "asc" },
  { label: "Name (Z–A)", field: "name", dir: "desc" },
  { label: "Price (Low–High)", field: "price", dir: "asc" },
  { label: "Price (High–Low)", field: "price", dir: "desc" },
  { label: "Stock (Low–High)", field: "stock", dir: "asc" },
  { label: "Stock (High–Low)", field: "stock", dir: "desc" },
];

const CATEGORY_OPTIONS = ["all", "Drugs", "Consumable", "Non-Consumable"] as const;

const ProductTable = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeSortLabel, setActiveSortLabel] = useState("Sort by");

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter + sort logic on mock data
  let products = [...allProducts];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (categoryFilter !== "all") {
    products = products.filter((p) => p.category === categoryFilter);
  }

  if (sortField !== "none") {
    products = [...products].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === "name") { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
      else if (sortField === "price") { valA = a.priceNum; valB = b.priceNum; }
      else if (sortField === "stock") { valA = a.stock; valB = b.stock; }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className={`flex items-center gap-2 h-12 px-5 rounded-xl border text-sm font-semibold transition
              ${filterOpen || categoryFilter !== "all"
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-primary-900"
              }`}
          >
            <SlidersHorizontal size={16} />
            Filter
            {categoryFilter !== "all" && (
              <span className="ml-1 bg-white text-primary-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                1
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-14 left-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-4 w-56">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                Category
              </p>
              <div className="flex flex-col gap-1">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setFilterOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition
                      ${categoryFilter === cat
                        ? "bg-primary-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                  >
                    {cat === "all" ? "All Products" : cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="border border-neutral-200 text-sm text-neutral-700 font-medium w-full h-12 rounded-xl px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent bg-neutral-50"
          />
          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-xl pointer-events-none">
            <Search size={18} className="text-purple-700" />
          </div>
        </div>

        {/* Sort by */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 h-12 px-5 rounded-xl border text-sm font-semibold transition whitespace-nowrap
              ${sortDropdownOpen || sortField !== "none"
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-primary-900"
              }`}
          >
            <ArrowUpDown size={16} />
            {activeSortLabel}
            {sortDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {sortDropdownOpen && (
            <div className="absolute top-14 right-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-2 w-52">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSortField(opt.field);
                    setSortDir(opt.dir);
                    setActiveSortLabel(opt.label);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition
                    ${sortField === opt.field && sortDir === opt.dir
                      ? "bg-primary-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
              {sortField !== "none" && (
                <button
                  onClick={() => {
                    setSortField("none");
                    setActiveSortLabel("Sort by");
                    setSortDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition mt-1 border-t border-neutral-100"
                >
                  Clear sort
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-100 text-left">
            <tr>
              <th className="p-4 font-semibold text-neutral-700">Thumbnail</th>
              <th className="p-4 font-semibold text-neutral-700">Product Name</th>
              <th className="p-4 font-semibold text-neutral-700">Category</th>
              <th className="p-4 font-semibold text-neutral-700">Price</th>
              <th className="p-4 font-semibold text-neutral-700">Stock</th>
              <th className="p-4 font-semibold text-neutral-700">Status</th>
              <th className="p-4 font-semibold text-neutral-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-neutral-400 text-sm">
                  No products match your filters.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr
                  key={index}
                  className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                >
                  <td className="p-4">
                    <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
                  </td>

                  <td className="p-4 font-medium text-neutral-900">{product.name}</td>
                  <td className="p-4 text-neutral-600">{product.category}</td>
                  <td className="p-4 text-neutral-700">{product.price}</td>
                  <td className="p-4 text-neutral-700">{product.stock.toLocaleString()}</td>

                  <td className="p-4">
                    <span className="px-3 py-1 text-xs rounded-md bg-green-50 text-green-700 font-medium">
                      {product.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-md hover:bg-primary-05 transition">
                        <Edit size={20} className="text-primary-600" />
                      </button>

                      <button className="p-2 rounded-md hover:bg-neutral-100 transition">
                        <Eye size={20} className="text-neutral-500" />
                      </button>

                      <button className="p-2 rounded-md hover:bg-warning-100 transition">
                        <Trash2 size={20} className="text-warning-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;