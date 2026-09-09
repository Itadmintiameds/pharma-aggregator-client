"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  ChevronRight,
} from "lucide-react";
import {
  getConsumableDeviceCategories,
  getNonConsumableDeviceCategories,
} from "@/src/services/product/ProductService";
import { getTherapeuticCategory } from "@/src/services/product/TherapeuticCategoryService";
import { getProductCategories as getFoodInfantProductCategories } from "@/src/services/product/FoodInfantService";
import { getCosmeticProductTypes } from "@/src/services/product/CosmeticService";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import CardSlider from "./CardSlider";

interface SubCategory {
  id: string | number;
  name: string;
}

// Matches the 6 top-level product categories (`tm_category`) used across the app —
// see categoryMap in seller_7a3b9f2c/dashboard/components/ProductList.tsx.
const PARENT_CATEGORIES = [
  { id: 1, name: "Drugs" },
  { id: 2, name: "Supplements / Nutraceuticals" },
  { id: 3, name: "Food & Infant Nutrition" },
  { id: 4, name: "Cosmetic & Personal Care" },
  { id: 5, name: "Consumable Medical Devices & Equipment" },
  { id: 6, name: "Non-Consumable Medical Devices & Equipment" },
];

const toSubCategories = (
  raw: unknown,
  idKey: string,
  nameKey: string
): SubCategory[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const record = entry as Record<string, unknown>;
    return {
      id: record[idKey] as string | number,
      name: record[nameKey] as string,
    };
  });
};

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);
  const [subcategoryCache, setSubcategoryCache] = useState<
    Record<number, SubCategory[]>
  >({});
  const [loadingParentId, setLoadingParentId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [allProducts, setAllProducts] = useState<BuyerProduct[]>([]);

  const sliderImages = [
    "/assets/images/medPic.png",
    "/assets/images/med2.png",
    "/assets/images/med3.png",
  ];

  useEffect(() => {
    getAllProducts()
      .then((result) => setAllProducts(result))
      .catch(() => setAllProducts([]));
  }, []);

  const selectedCategoryName = PARENT_CATEGORIES.find(
    (c) => c.id === selectedCategoryId
  )?.name;

  const displayedProducts = useMemo(() => {
    const filtered = selectedCategoryId
      ? allProducts.filter((p) => p.categoryId === selectedCategoryId)
      : allProducts;
    return filtered.slice(0, 12);
  }, [allProducts, selectedCategoryId]);

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const loadSubcategories = async (parentId: number) => {
    if (subcategoryCache[parentId]) return;
    setLoadingParentId(parentId);
    let items: SubCategory[] = [];
    try {
      switch (parentId) {
        case 1:
        case 2: {
          const res = await getTherapeuticCategory(parentId);
          items = toSubCategories(res, "therapeuticCategoryId", "therapeuticCategory");
          break;
        }
        case 3: {
          const res = await getFoodInfantProductCategories(3);
          items = toSubCategories(res, "productCategoryId", "productCategory");
          break;
        }
        case 4: {
          const res = await getCosmeticProductTypes();
          items = toSubCategories(res, "id", "name");
          break;
        }
        case 5: {
          const res = await getConsumableDeviceCategories();
          items = toSubCategories(res, "deviceCatId", "deviceName");
          break;
        }
        case 6: {
          const res = await getNonConsumableDeviceCategories();
          items = toSubCategories(res, "deviceCatId", "deviceName");
          break;
        }
      }
    } catch {
      items = [];
    }
    setSubcategoryCache((prev) => ({ ...prev, [parentId]: items }));
    setLoadingParentId((prev) => (prev === parentId ? null : prev));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? sliderImages.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full px-3 sm:px-4 mx-auto max-w-[1280px]">
    <div className="flex flex-col bg-white lg:flex-row gap-3 sm:gap-4 w-full min-h-[auto] lg:items-stretch">
      {/* ================= LEFT CATEGORY SIDEBAR ================= */}
      <aside className="relative w-full lg:w-[240px] xl:w-[280px] bg-base-white rounded-2xl shadow-sm border border-pneutral-200 shrink-0 lg:flex lg:flex-col hidden">
        <div className="relative flex items-center bg-base-white text-pneutral-900 px-3 sm:px-4 py-2.5 sm:py-3 h-[48px] sm:h-[52px] rounded-t-2xl border-b border-pneutral-200 shrink-0">
          <Menu size={16} className="sm:w-[18px]" />
          <span className="absolute left-1/2 -translate-x-1/2 font-heading font-semibold text-xs sm:text-sm xl:text-base whitespace-nowrap">
            List Category
          </span>
          <ChevronRight size={16} className="sm:w-[18px] ml-auto" />
        </div>

        <div className="flex-1 flex flex-col">
          {PARENT_CATEGORIES.map((item) => {
            const subcategories = subcategoryCache[item.id];
            const isHovered = hoveredParentId === item.id;
            const isSelected = selectedCategoryId === item.id;

            return (
              <div
                key={item.id}
                className="relative flex-1 min-h-[44px]"
                onMouseEnter={() => {
                  setHoveredParentId(item.id);
                  loadSubcategories(item.id);
                }}
                onMouseLeave={() => setHoveredParentId(null)}
              >
                <div
                  onClick={() => handleSelectCategory(item.id)}
                  className={`h-full flex items-center justify-between px-3 sm:px-4 text-xs sm:text-sm cursor-pointer border-b border-pneutral-200 last:border-none last:rounded-b-2xl group ${
                    isSelected
                      ? "bg-primary-800 text-white"
                      : "text-neutral-900 hover:bg-primary-800 hover:text-white"
                  }`}
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <ChevronRight
                    size={12}
                    className={`sm:w-[14px] transition shrink-0 ${
                      isSelected
                        ? "text-white"
                        : "text-neutral-900 group-hover:text-white"
                    }`}
                  />
                </div>

                {isHovered && (
                  <div className="absolute left-full top-0 z-50 w-64 bg-white rounded-r-xl shadow-lg border border-neutral-200 overflow-hidden">
                    <p className="px-4 py-2.5 text-xs font-semibold text-white bg-primary-800 uppercase tracking-wide">
                      {item.name}
                    </p>
                    <div className="max-h-[360px] overflow-y-auto scrollbar-thin py-1">
                      {loadingParentId === item.id && !subcategories && (
                        <p className="px-4 py-2 text-xs text-neutral-400">
                          Loading...
                        </p>
                      )}
                      {subcategories?.length === 0 && (
                        <p className="px-4 py-2 text-xs text-neutral-400">
                          No subcategories found
                        </p>
                      )}
                      {subcategories?.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => handleSelectCategory(item.id)}
                          className="px-4 py-1.5 text-xs sm:text-sm text-neutral-800 hover:bg-primary-50 hover:text-primary-700 cursor-pointer truncate"
                        >
                          {sub.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ================= RIGHT SECTION ================= */}
      <section className="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-5 xl:gap-6 min-w-0 w-full lg:w-[calc(100%-240px)] xl:w-[calc(100%-280px)] max-w-full">
        {/* ================= HERO BANNER ================= */}
        <div className="relative h-auto min-h-[280px] sm:min-h-[300px] lg:h-[310px] bg-secondary-100 rounded-2xl px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-1 overflow-hidden w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 lg:gap-4 xl:gap-8 w-full">
            <div className="w-full md:w-[380px] lg:w-[400px] xl:w-[430px] text-center md:text-left">
              <h1 className="font-heading text-lg sm:text-xl text-pneutral-900 font-bold tracking-wide mb-1">
                TiaMeds
              </h1>

              <h1 className="font-heading py-1 sm:py-2 text-xl sm:text-2xl md:text-3xl lg:text-h3 xl:text-h3 leading-tight text-pneutral-900 font-semibold">
                India&apos;s First <br className="hidden sm:block" />
                <span className="text-primary-700 font-bold">
                  Compliance-Controlled
                </span>{" "}
                <br className="hidden sm:block" />
                Pharma Marketplace
              </h1>

              <p className="font-body text-pneutral-700 text-xs sm:text-sm lg:text-base leading-relaxed max-w-full">
                Connecting verified pharma buyers & sellers. AI-powered
                matching, instant quotes, guaranteed compliance, and express
                delivery.
              </p>
            </div>

            <div className="relative w-[280px] sm:w-[320px] md:w-[340px] lg:w-[350px] xl:w-[460px] h-[160px] sm:h-[180px] md:h-[200px] lg:h-[220px] xl:h-[224px]">
              {sliderImages.map((src, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100 z-10" : "opacity-0"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 340px, (max-width: 1280px) 350px, 460px"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HERO CONTROLS */}
          <div className="absolute bottom-2 sm:bottom-4 lg:bottom-5 right-2 sm:right-4 lg:right-5 flex items-center gap-1 sm:gap-2 xl:gap-4 bg-white shadow-md px-3 sm:px-4 xl:px-5 py-1 sm:py-1.5 xl:py-2 rounded-full">
            <button
              onClick={prevSlide}
              className="hover:scale-110 transition p-1"
              aria-label="Previous slide"
            >
              <ArrowLeft size={14} className="sm:w-[16px] xl:w-[20px]" />
            </button>
            <span className="text-xs sm:text-sm font-medium min-w-[45px] text-center">
              {currentSlide + 1} / {sliderImages.length}
            </span>
            <button
              onClick={nextSlide}
              className="hover:scale-110 transition p-1"
              aria-label="Next slide"
            >
              <ArrowRight size={14} className="sm:w-[16px] xl:w-[20px]" />
            </button>
          </div>
        </div>

      </section>
    </div>

      {/* ================= PROMOTIONAL PRODUCT ROW ================= */}
      {selectedCategoryId && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs sm:text-sm text-neutral-600">
            Showing:{" "}
            <span className="font-medium text-neutral-900">
              {selectedCategoryName}
            </span>
          </span>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {selectedCategoryId && displayedProducts.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-sm text-neutral-500">
          No products found in this category yet.
        </div>
      ) : (
        <CardSlider products={displayedProducts} />
      )}
    </div>
  );
};

export default HeroSection;
