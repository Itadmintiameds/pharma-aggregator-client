"use client";

import React, { useEffect, useState, useRef } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import CommonModal from "../commonComponent/CommonModal";
import DeleteProduct from "./DeleteProduct";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
}

const categoryMap: Record<number, string> = {
  1: "Drug",
  2: "Supplement",
  3: "Infant Food",
  4: "Cosmetic",
  5: "Consumable Medical Device",
  6: "Non-Consumable Medical Device",
};

const sortOptions = [
  { label: "Name (A–Z)", value: "name_asc" },
  { label: "Name (Z–A)", value: "name_desc" },
  { label: "Price (Low–High)", value: "price_asc" },
  { label: "Price (High–Low)", value: "price_desc" },
  { label: "Stock (Low–High)", value: "stock_asc" },
  { label: "Stock (High–Low)", value: "stock_desc" },
];

// Dropdown component
const Dropdown = ({
  label,
  options,
  value,
  onChange,
  icon,
  iconPosition = "left",
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          height: 48,
          minHeight: 48,
          padding: "12px 16px",
          background: "#F9F9F8",
          boxShadow: "-1px 1px 4px -16px rgba(0,0,0,0.25)",
          borderRadius: 8,
          border: "1px solid #D5D5D4",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: "20px",
          color: "#1E1E1D",
        }}
      >
        {iconPosition === "left" && icon}
        {selected ? selected.label : label}
        {iconPosition === "right" && (
          <>
            {icon || (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 6L9 11L13.5 6" stroke="#1E1E1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </>
        )}
        {iconPosition === "left" && (
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#1E1E1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            background: "#fff",
            border: "1px solid #D5D5D4",
            borderRadius: 8,
            zIndex: 50,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              fontFamily: "'Open Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#969793",
              borderBottom: "1px solid #EAEAE9",
            }}
          >
            {label}
          </div>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                background: value === opt.value ? "#E4D6FB" : "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: 14,
                fontWeight: value === opt.value ? 600 : 400,
                color: value === opt.value ? "#4C0080" : "#1E1E1D",
                borderBottom: "1px solid #EAEAE9",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter dropdown for stock/category
const FilterDropdown = ({
  stockFilter,
  setStockFilter,
  categoryFilter,
  setCategoryFilter,
  availableCategories,
}: {
  stockFilter: string;
  setStockFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  availableCategories: number[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stockOptions = [
    { label: "All Stocks", value: "all" },
    { label: "In Stock", value: "instock" },
    { label: "Low Stock (< 100)", value: "lowstock" },
    { label: "Out of Stock", value: "outofstock" },
  ];

  const allCategoryOptions = [
    { label: "All Categories", value: "all" },
    ...availableCategories.map((id) => ({ label: categoryMap[id] || `Category ${id}`, value: String(id) })),
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          alignSelf: "stretch",
          height: 43,
          padding: "0 16px",
          background: "#F9F9F8",
          borderRadius: 8,
          border: "1px solid #D5D5D4",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#1E1E1D",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2.25 4.5H15.75M5.25 9H12.75M8.25 13.5H9.75" stroke="#1E1E1D" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Filter
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: 220,
            background: "#fff",
            border: "1px solid #D5D5D4",
            borderRadius: 8,
            zIndex: 50,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Stock Section */}
          <div style={{ padding: "8px 12px 4px", fontFamily: "'Open Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "#969793", letterSpacing: "0.04em" }}>
            STOCK
          </div>
          {stockOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStockFilter(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "9px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: 14,
                fontWeight: stockFilter === opt.value ? 600 : 400,
                color: stockFilter === opt.value ? "#4C0080" : "#1E1E1D",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: stockFilter === opt.value ? "5px solid #4C0080" : "2px solid #D5D5D4",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {opt.label}
            </button>
          ))}
          {/* Category Section */}
          <div style={{ padding: "8px 12px 4px", fontFamily: "'Open Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "#969793", letterSpacing: "0.04em", borderTop: "1px solid #EAEAE9", marginTop: 4 }}>
            CATEGORY
          </div>
          {allCategoryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "9px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: 14,
                fontWeight: categoryFilter === opt.value ? 600 : 400,
                color: categoryFilter === opt.value ? "#4C0080" : "#1E1E1D",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: categoryFilter === opt.value ? "5px solid #4C0080" : "2px solid #D5D5D4",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {opt.label}
            </button>
          ))}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #EAEAE9", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setStockFilter("all"); setCategoryFilter("all"); setOpen(false); }}
              style={{
                padding: "6px 14px",
                background: "#4C0080",
                color: "#F9F9F8",
                border: "none",
                borderRadius: 6,
                fontFamily: "'Open Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const columns: Column<ProductListData>[] = [
  {
    header: "Thumbnail",
    accessor: (row) => {
      const image = row.productImages?.[0]?.productImage;
      return (
        <img
          src={image || "/icons/Tumbnail.svg"}
          alt="product"
          style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
        />
      );
    },
  },
  {
    header: "Product Name",
    accessor: (row) => (
      <span
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "#000",
          wordWrap: "break-word",
        }}
      >
        {row.productName ?? "-"}
      </span>
    ),
  },
  {
    header: "Category",
    accessor: (row) => (
      <span
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "#000",
        }}
      >
        {categoryMap[row.categoryId as number] || "-"}
      </span>
    ),
  },
  {
    header: "Price",
    accessor: (row) => (
      <span
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "#000",
        }}
      >
        {row.pricingDetails?.[0]?.mrp != null ? `₹${row.pricingDetails[0].mrp}` : "-"}
      </span>
    ),
  },
  {
    header: "Stock",
    accessor: (row) => (
      <span
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "#000",
        }}
      >
        {row.pricingDetails?.[0]?.stockQuantity ?? "-"}
      </span>
    ),
  },
  {
    header: "Status",
    accessor: () => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 32,
          padding: "6px 8px",
          background: "#DCF7CB",
          borderRadius: 8,
          fontFamily: "'Open Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: "20px",
          color: "#378200",
          wordWrap: "break-word",
        }}
      >
        Active
      </span>
    ),
  },
];

const ProductList = ({ setCurrentView, setSelectedProductId }: ProductListProps) => {
  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortValue, setSortValue] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList();
      setData(response || []);
    } catch (error) {
      console.error("Error fetching Drug Product List:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categoryViewMap: Record<number, DashboardView> = {
    1: "editDrug",
    2: "editSupplement",
    3: "editFoodInfant",
    4: "editCosmetic",
    5: "editConsumable",
    6: "editNonConsumable",
  };

  // Derive unique categories from data
  const availableCategories = Array.from(
    new Set(data.map((p) => p.categoryId).filter((id): id is number => id != null))
  );

  // Filtered + sorted data
  const processedData = React.useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.productName ?? "").toLowerCase().includes(q) ||
          (categoryMap[p.categoryId as number] ?? "").toLowerCase().includes(q)
      );
    }

    // Stock filter
    if (stockFilter === "instock") {
      result = result.filter((p) => (p.pricingDetails?.[0]?.stockQuantity ?? 0) > 0);
    } else if (stockFilter === "lowstock") {
      result = result.filter((p) => {
        const qty = p.pricingDetails?.[0]?.stockQuantity ?? 0;
        return qty > 0 && qty < 100;
      });
    } else if (stockFilter === "outofstock") {
      result = result.filter((p) => (p.pricingDetails?.[0]?.stockQuantity ?? 0) === 0);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((p) => String(p.categoryId) === categoryFilter);
    }

    // Sort
    if (sortValue === "name_asc") result.sort((a, b) => (a.productName ?? "").localeCompare(b.productName ?? ""));
    else if (sortValue === "name_desc") result.sort((a, b) => (b.productName ?? "").localeCompare(a.productName ?? ""));
    else if (sortValue === "price_asc") result.sort((a, b) => (a.pricingDetails?.[0]?.mrp ?? 0) - (b.pricingDetails?.[0]?.mrp ?? 0));
    else if (sortValue === "price_desc") result.sort((a, b) => (b.pricingDetails?.[0]?.mrp ?? 0) - (a.pricingDetails?.[0]?.mrp ?? 0));
    else if (sortValue === "stock_asc") result.sort((a, b) => (a.pricingDetails?.[0]?.stockQuantity ?? 0) - (b.pricingDetails?.[0]?.stockQuantity ?? 0));
    else if (sortValue === "stock_desc") result.sort((a, b) => (b.pricingDetails?.[0]?.stockQuantity ?? 0) - (a.pricingDetails?.[0]?.stockQuantity ?? 0));

    return result;
  }, [data, searchQuery, stockFilter, categoryFilter, sortValue]);

  return (
    <div
      style={{
        width: "100%",
        paddingTop: 24,
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Top row: dropdowns + Add New Product */}
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        
        {/* All Stocks dropdown (maps to stock filter) */}
        <Dropdown
          label=""
          options={[
            { label: "All Stocks", value: "all" },
            { label: "In Stock", value: "instock" },
            { label: "Low Stock (< 100)", value: "lowstock" },
            { label: "Out of Stock", value: "outofstock" },
          ]}
          value={stockFilter}
          onChange={setStockFilter}
          iconPosition="right"
        />

        {/* All Categories dropdown */}
        <Dropdown
          label=""
          options={[
            { label: "All Categories", value: "all" },
            ...availableCategories.map((id) => ({
              label: categoryMap[id] || `Category ${id}`,
              value: String(id),
            })),
          ]}
          value={categoryFilter}
          onChange={setCategoryFilter}
          iconPosition="right"
        />

        {/* Add New Product button */}
        <button
          style={{
            height: 48,
            minHeight: 48,
            padding: "12px 16px",
            background: "#4C0080",
            boxShadow: "-1px 1px 4px -16px rgba(0,0,0,0.25)",
            borderRadius: 8,
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: "'Open Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "20px",
            color: "#F9F9F8",
            whiteSpace: "nowrap",
          }}
          onClick={() => setCurrentView("addProduct" as DashboardView)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4.167v11.666M4.167 10h11.666" stroke="#F9F9F8" strokeWidth="1.667" strokeLinecap="round" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Search + Filter + Sort row */}
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", gap: 24 }}>
          {/* Filter button */}
          <FilterDropdown
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            availableCategories={availableCategories}
          />

          {/* Search input */}
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 43,
                paddingLeft: 16,
                paddingRight: 56,
                background: "#F9F9F8",
                border: "1px solid #D5D5D4",
                borderRadius: 8,
                fontFamily: "'Open Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                lineHeight: "22px",
                color: "#1E1E1D",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: 43,
                width: 43,
                background: "#E4D6FB",
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                border: "1px solid #D5D5D4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#4C0080" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="#4C0080" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Sort by dropdown */}
          <Dropdown
            label="Sort by"
            options={sortOptions}
            value={sortValue}
            onChange={setSortValue}
            iconPosition="right"
          />
        </div>

        {/* Table */}
        <div
          style={{
            alignSelf: "stretch",
            overflow: "hidden",
            borderRadius: 8,
            outline: "1px solid #D5D5D4",
            outlineOffset: "-1px",
          }}
        >
          <Table<ProductListData>
            columns={columns}
            data={processedData}
            loading={loading}
            actions={(row) => (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src="/icons/EditIcon.svg"
                  alt="edit"
                  style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover", cursor: "pointer" }}
                  onClick={() => {
                    const view = categoryViewMap[row.categoryId as number];
                    if (!view) return;
                    setSelectedProductId(row.productId ?? "");
                    setTimeout(() => setCurrentView(view), 0);
                  }}
                />
                <img
                  src="/icons/ViewIcon.svg"
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                  onClick={() => {
                    setSelectedProductId(row.productId ?? "");
                    setCurrentView("productView");
                  }}
                />
                <img
                  src="/icons/DeleteIcon.svg"
                  alt="delete"
                  style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover", cursor: "pointer" }}
                  onClick={() => {
                    setSelectedProductIdLocal(row.productId);
                    setOpenDeleteModal(true);
                  }}
                />
              </div>
            )}
          />
        </div>
      </div>

      {openDeleteModal && selectedProductIdLocal && (
        <CommonModal onClose={() => setOpenDeleteModal(false)}>
          <DeleteProduct
            productId={selectedProductIdLocal}
            onClose={() => setOpenDeleteModal(false)}
            onSuccess={fetchProducts}
          />
        </CommonModal>
      )}
    </div>
  );
};

export default ProductList;
