"use client";

<<<<<<< HEAD
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
=======

import React, { useState, useEffect } from "react";
import { Heart, Share2 } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { PiSealCheckLight } from "react-icons/pi";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { SlHandbag, SlReload } from "react-icons/sl";
import { LuShield, LuTruck } from "react-icons/lu";
import { IoIosArrowBack } from "react-icons/io";
import Image from "next/image";
import { getDrugProductById } from "@/src/services/product/ProductService";


interface ProductViewProps {
  productId: string | null;
  setCurrentView: (view: DashboardView) => void;
}

const images = [
  "/assets/images/SellerMed.jpg",
  "/assets/images/SellerMed2.jpg",
  "/assets/images/SellerMed3.jpg",
  "/assets/images/SellerMed4.jpg",
  "/assets/images/SellerMed5.jpg",
];

const ProductView1 = ({ productId, setCurrentView }: ProductViewProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState(1);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      const response = await getDrugProductById(productId);
      console.log("API Response:", response);

      setProductData(response);

      if (response?.packagingDetails?.minimumOrderQuantity) {
        setQuantity(response.packagingDetails.minimumOrderQuantity);
      }

    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchProductDetails();
}, [productId]);

  // Access data directly from productData
  const product = productData;
  const packaging = productData?.packagingDetails;
  const pricing = productData?.pricingDetails?.[0];

  // Format product name: productName + strength + dosageForm
  const formattedProductName = product
    ? `${product.productName || ''} ${product.strength || ''}mg ${product.dosageForm || ''}`.trim()
    : "";

  // Format description: therapeuticCategory + therapeuticSubcategory
const formattedDescription = "Broad-spectrum antibiotic for bacterial infections";

  // Calculate total price
  const totalPrice = pricing ? pricing.finalPrice * quantity : 0;

  if (!productData || loading) {
    return <div className="w-full bg-white rounded-xl p-6 space-y-8"></div>;
  }

  return (
    <div className="w-full bg-white rounded-xl p-6 space-y-8">

      {/* MAIN SECTION */}

      <div className="grid grid-cols-2 gap-10">

        {/* LEFT SIDE */}

        <div>

          {/* MAIN IMAGE */}

          <div className="relative rounded-xl overflow-hidden w-full h-171 flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Product Image"
              fill
              className="object-cover rounded-xl"
            />

            <button
              className="absolute left-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
              onClick={() => {
                const currentIndex = images.indexOf(selectedImage);
                const prevIndex = (currentIndex - 1 + images.length) % images.length;
                setSelectedImage(images[prevIndex]);
              }}
            >
              <IoIosArrowBack size={20} />
            </button>

            <button
              className="absolute right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
              onClick={() => {
                const currentIndex = images.indexOf(selectedImage);
                const nextIndex = (currentIndex + 1) % images.length;
                setSelectedImage(images[nextIndex]);
              }}
            >
              <IoIosArrowBack size={20} className="rotate-180" />
            </button>

            {pricing?.discountPercentage && pricing.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-[#FB2C36] text-white text-sm px-3 py-1 rounded-full">
                {pricing.discountPercentage}% OFF
              </span>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-white rounded-full p-2 shadow">
                <Heart size={20} />
              </button>
              <button className="bg-white rounded-full p-2 shadow">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* THUMBNAILS */}
          <div className="flex gap-3 mt-4">
            {images.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`relative h-[127px] w-[127px] rounded-lg cursor-pointer border overflow-hidden ${selectedImage === img
                  ? "border-primary-900"
                  : "border-neutral-200"
                  }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* VERIFIED / SHIPPING / RETURNS */}
          <div className="flex items-center gap-20 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <LuShield size={20} style={{ color: "#00A63E" }} />
              <span className="text-neutral-600">Verified</span>
            </div>

            <div className="flex items-center gap-2">
              <LuTruck size={20} style={{ color: "#155DFC" }} />
              <span className="text-neutral-600">Fast Ship</span>
            </div>

            <div className="flex items-center gap-2">
              <SlReload size={20} style={{ color: "#9810FA" }} />
              <span className="text-neutral-600">Returns</span>
            </div>
          </div>

          {/* ADDITIONAL DISCOUNTS - Static as mentioned */}
          <div className="bg-[#EFF6FF] border-2 border-[#BEDBFF] rounded-lg p-4 mt-4">
            <p className="font-semibold text-[#1C398E] mb-2">
              Additional Discounts Available
            </p>
            <ul className="text-sm text-[#193CB8] list-disc ml-4 space-y-1">
              <li>Corporate buyers: Up to 15% additional discount</li>
              <li>Annual contract: Up to 25% savings</li>
              <li>First-time buyers: Extra ₹10 off on orders above ₹200</li>
            </ul>
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div>

          {/* TAGS - Static as mentioned */}
          <div className="flex gap-2 mb-3">
            <span className="bg-primary-05 text-secondary-700 px-3 py-1 rounded-xl">
              Prescription Required
            </span>
            <span className="bg-success-50 text-success-800 px-3 py-1 rounded-xl flex items-center gap-1">
              <PiSealCheckLight className="text-sm" />
              FDA Approved
            </span>
          </div>

          {/* TITLE */}
          <h1 className="text-[28px] font-semibold mb-2">
            {formattedProductName}
          </h1>

          <p className="text-neutral-700 text-sm mb-4">
            {formattedDescription}
          </p>

          {/* PRICE CARD */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[28px] font-bold">₹{pricing?.finalPrice?.toFixed(2)}</span>
              <span className="text-[#99A1AF] text-[18px] line-through">
                ₹{pricing?.mrp?.toFixed(2)}
              </span>
              <span className="bg-warning-100 text-warning-600 text-sm px-2 py-1 rounded">
                Save {pricing?.discountPercentage}%
              </span>
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              Price per pack ({packaging?.numberOfUnits} {product?.dosageForm})
            </p>
          </div>

          {/* SPECIAL OFFERS - Static as mentioned */}
          <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="font-semibold mb-2 text-sm text-neutral-900">Special Offers</p>
            <ul className="text-sm text-neutral-700 list-disc ml-4 space-y-1">
              <li>Buy 5+ packs: Extra 5% off</li>
              <li>Buy 10+ packs: Extra 10% off + Free shipping</li>
              <li>Bulk orders: Additional volume discounts available</li>
            </ul>
          </div>

          {/* PACK SIZE */}
          <h3 className="font-semibold text-[#364153] text-sm mb-3">
            Select Pack Size <span className="text-warning-500">*</span>
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* First Pack - Dynamic */}
            <div
              onClick={() => setSelectedPack(1)}
              className={`relative border rounded-xl p-5 cursor-pointer text-center transition ${selectedPack === 1
                ? "border-2 border-primary-800 bg-secondary-100"
                : "border-2 border-neutral-300"
                }`}
            >
              {selectedPack === 1 && (
                <div className="absolute -top-2 -right-2 bg-purple-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
              <p className="font-semibold text-lg">{packaging?.packSize}mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹{pricing?.mrp?.toFixed(2)}</p>
              <p className="text-sm text-success-700 font-semibold">{pricing?.discountPercentage}% off</p>
            </div>

            {/* Second Pack - Static */}
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">100mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹599</p>
              <p className="text-sm text-success-700 font-semibold">15% off</p>
            </div>

            {/* Third Pack - Static */}
            <div className="relative border-2 border-neutral-300 rounded-xl p-5 cursor-pointer text-center">
              <p className="font-semibold text-lg">200mg</p>
              <p className="text-sm font-semibold text-neutral-700">₹999</p>
              <p className="text-sm text-success-700 font-semibold">20% off</p>
            </div>
          </div>

          {/* PRODUCT DETAILS */}
          <h3 className="text-[16px] mb-3">Product Details</h3>

          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Pack Size</p>
              <p className="text-[#101828] text-[16px]">{packaging?.packSize} {product?.dosageForm}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Min Order (MOQ)</p>
              <p className="text-[#101828] text-[16px]">{packaging?.minimumOrderQuantity} Packs</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Dosage Form</p>
              <p className="text-[#101828] text-[16px]">{product?.dosageForm}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Manufacturer</p>
              <p className="text-[#101828] text-[16px]">{pricing?.manufacturerName}</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Strength</p>
              <p className="text-[#101828] text-[16px]">{product?.strength}mg</p>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-3">
              <p className="text-[#6A7282] text-xs">Max Order</p>
              <p className="text-[#101828] text-[16px]">{packaging?.maximumOrderQuantity} Packs</p>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mb-6">
            <p className="text-sm text-[#364153] mb-2">
              Quantity (Packs)
            </p>

            <div className="flex items-center gap-4">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-2 border-r border-neutral-300 text-neutral-900"
                  onClick={() => setQuantity(Math.max(packaging?.minimumOrderQuantity || 1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-6 flex items-center justify-center">
                  {quantity}
                </span>
                <button
                  className="px-4 py-2 border-l border-neutral-300 text-neutral-900"
                  onClick={() => setQuantity(Math.min(packaging?.maximumOrderQuantity || 1000, quantity + 1))}
                >
                  +
                </button>
              </div>
              <p className="text-sm text-[#4A5565]">
                Total: ₹{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#6A7282] mt-1">
            Minimum order: {packaging?.minimumOrderQuantity} packs | Maximum: {packaging?.maximumOrderQuantity} packs
          </p>

          {/* BUTTONS - Static */}
          <button className="w-full bg-primary-900 text-white text-[16px] font-semibold py-3 rounded-lg mt-6 flex items-center justify-center gap-2">
            <SlHandbag size={24} />
            Buy Now
          </button>

          <button className="w-full border-2 border-primary-900 text-primary-900 text-[16px] font-semibold py-3 rounded-lg mt-3 flex items-center justify-center gap-2">
            <HiOutlineShoppingCart size={24} />
            Add to Cart
          </button>

        </div>

      </div>

      {/* PRODUCT DESCRIPTION */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">
          Product Description
        </h2>
        <p className="text-sm text-neutral-600 mb-3">
          {product?.productDescription}
        </p>

        {/* <h3 className="font-semibold mt-4 mb-2">Key Features:</h3>
        <ul className="list-disc ml-5 text-sm text-neutral-600 space-y-1">
          <li>Broad-spectrum antibiotic effective against bacterial infections</li>
          <li>High-quality pharmaceutical-grade ingredients</li>
          <li>Manufactured in FDA-approved facility</li>
          <li>Extended shelf life of 24 months</li>
          <li>Easy-to-swallow capsule form</li>
        </ul> */}

        <h3 className="font-semibold mt-4 mb-2">
          Warnings & Precautions:
        </h3>
        <p className="text-sm text-neutral-600">
          {product?.warningsPrecautions}
        </p>
      </div>

>>>>>>> dcdc8ffed78e8e9f39e17f8d754e47d65e93d725
    </div>
  );
};

<<<<<<< HEAD
export default ProductTable;
=======

export default ProductView1;
>>>>>>> dcdc8ffed78e8e9f39e17f8d754e47d65e93d725
