import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import { getMoleculeDesc } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  editDrugProduct,
  getDrugCategory,
  getDrugProductById,
  getTherapeuticSubcategory,
} from "@/src/services/product/ProductService";
import { PlusIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";



// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface Method {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  ready: boolean;
  accent: string;
  comingSoon?: boolean;
}

// ─────────────────────────────────────────────
// Onboarding Method Definitions
// ─────────────────────────────────────────────

const METHODS: Method[] = [
  {
    id: "manual",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Manual Entry",
    desc: "Fill in product details using the form",
    ready: true,
    accent: "#4B0082",
  },
  {
    id: "excel",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: "Excel / CSV",
    desc: "Bulk upload via spreadsheet",
    ready: true,
    accent: "#16a34a",
  },
  {
    id: "api",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "API Integration",
    desc: "Connect via REST API",
    ready: false,
    accent: "#2563eb",
    comingSoon: true,
  },
  {
    id: "db",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
        <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    label: "Database Sync",
    desc: "Sync from your database",
    ready: false,
    accent: "#d97706",
    comingSoon: true,
  },
];

// ─────────────────────────────────────────────
// Excel Upload Sub-View
// ─────────────────────────────────────────────

interface ExcelUploadViewProps {
  onBack: () => void;
}

function ExcelUploadView({ onBack }: ExcelUploadViewProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); setSubmitted(true); }, 1800);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "24px 16px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#f0fdf4", border: "2px solid #86efac",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 6 }}>Submitted Successfully!</div>
        <div style={{ color: "#555", fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>{file?.name}</span> is being processed
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 12, color: "#15803d" }}>
          Processing usually takes 2–5 minutes for up to 500 products
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: "#4B0082", fontSize: 13, fontWeight: 600, marginBottom: 16, padding: 0,
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Back
      </button>

      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#1E1E1E" }}>Upload Excel / CSV</div>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>Download our template, fill in product data, and upload.</div>

      {/* Template download row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: "rgba(75,0,130,0.04)",
        border: "1px solid rgba(75,0,130,0.12)", borderRadius: 10, marginBottom: 14,
      }}>
        <div>
          <div style={{ fontWeight: 600, color: "#4B0082", fontSize: 13 }}>drug_products_template.xlsx</div>
          <div style={{ color: "#888", fontSize: 11 }}>Download and fill before uploading</div>
        </div>
        <a
          href="/templates/Suppliments or Nutraceuticals _Product_Upload_Template_v0.1.xlsx"
          download="Suppliments or Nutraceuticals _Product_Upload_Template_v0.1.xlsx"
          style={{
            background: "#4B0082", color: "white", borderRadius: 8,
            padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            textDecoration: "none", display: "inline-block",
          }}
        >
          Download
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#4B0082" : file ? "#16a34a" : "#d8b4fe"}`,
          borderRadius: 12, padding: "28px 16px",
          textAlign: "center", cursor: "pointer",
          background: dragging ? "rgba(75,0,130,0.04)" : file ? "rgba(22,163,74,0.04)" : "rgba(255,255,255,0.7)",
          transition: "all 0.2s ease", marginBottom: 14,
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileInput} />
        {file ? (
          <>
            <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
            <div style={{ fontWeight: 600, color: "#15803d", fontSize: 13 }}>{file.name}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 26, marginBottom: 8 }}>📂</div>
            <div style={{ fontWeight: 600, color: "#4B0082", fontSize: 13, marginBottom: 3 }}>
              {dragging ? "Drop it here!" : "Drag & drop your file"}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>or click to browse · .xlsx, .xls, .csv</div>
          </>
        )}
      </div>

      <button onClick={handleSubmit} disabled={!file || uploading} style={{
        width: "100%", padding: "12px", borderRadius: 10, border: "none",
        background: !file ? "#f3f4f6" : "#4B0082",
        color: !file ? "#9CA3AF" : "white",
        fontWeight: 700, fontSize: 14, cursor: !file ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s",
      }}>
        {uploading ? (
          <>
            <span style={{
              width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent",
              borderRadius: "50%", animation: "obSpin 0.8s linear infinite", display: "inline-block",
            }} />
            Uploading...
          </>
        ) : "Submit File"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Inline Glass Onboarding Overlay
// ─────────────────────────────────────────────

interface OnboardingOverlayProps {
  onSelectManual: () => void;
}

function OnboardingOverlay({ onSelectManual }: OnboardingOverlayProps) {
  const [excelView, setExcelView] = useState(false);

  const handleSelect = (method: Method) => {
    if (!method.ready) return;
    if (method.id === "manual") { onSelectManual(); return; }
    if (method.id === "excel") { setExcelView(true); }
  };

  return (
    <>
      <style>{`
        @keyframes obFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes obSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes obSpin    { to { transform: rotate(360deg) } }
        .ob-card {
          border-radius: 14px;
          padding: 18px 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          border: 1.5px solid rgba(75,0,130,0.1);
          background: rgba(255,255,255,0.75);
          position: relative;
          backdrop-filter: blur(4px);
        }
        .ob-card:hover:not(.ob-card-disabled) {
          border-color: rgba(75,0,130,0.3);
          background: rgba(255,255,255,0.97);
          box-shadow: 0 4px 18px rgba(75,0,130,0.1);
          transform: translateY(-2px);
        }
        .ob-card-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      {/* Overlay — absolute inside the relative form wrapper */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        borderRadius: 12,
        background: "rgba(245,240,255,0.65)",
        backdropFilter: "blur(14px) saturate(1.6)",
        WebkitBackdropFilter: "blur(14px) saturate(1.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 16px",
        animation: "obFadeIn 0.25s ease",
      }}>
        {/* White glass card */}
        <div style={{
          background: "rgba(255,255,255,0.88)",
          border: "1.5px solid rgba(75,0,130,0.1)",
          borderRadius: 20,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 510,
          boxShadow: "0 8px 48px rgba(75,0,130,0.09), 0 1px 0 rgba(255,255,255,1) inset",
          backdropFilter: "blur(24px)",
          animation: "obSlideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
        }}>
          {excelView ? (
            <ExcelUploadView onBack={() => setExcelView(false)} />
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                {/* <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(75,0,130,0.06)",
                  border: "1px solid rgba(75,0,130,0.12)",
                  borderRadius: 20, padding: "3px 12px",
                  fontSize: 11, fontWeight: 700, color: "#6b21a8",
                  marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9F75FC", display: "inline-block" }} />
                  Product Onboarding
                </div> */}
                <div style={{ fontSize: 21, fontWeight: 800, color: "#1E1E1E", lineHeight: 1.25, marginBottom: 5 }}>
                  How would you like to add products?
                </div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>
                  Choose the method that best fits your workflow
                </div>
              </div>

              {/* Method cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {METHODS.map((method) => (
                  <div
                    key={method.id}
                    className={`ob-card${!method.ready ? " ob-card-disabled" : ""}`}
                    onClick={() => handleSelect(method)}
                  >
                    {method.comingSoon && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.05)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 5, padding: "1px 7px",
                        fontSize: 9, fontWeight: 700,
                        color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase",
                      }}>Soon</div>
                    )}
                    <div style={{
                      width: 40, height: 40, borderRadius: 11,
                      background: `${method.accent}10`,
                      border: `1px solid ${method.accent}22`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: method.accent, marginBottom: 12,
                    }}>
                      {method.icon}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1E1E1E", marginBottom: 4 }}>
                      {method.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                      {method.desc}
                    </div>
                    {method.ready && (
                      <div style={{
                        marginTop: 12, display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, fontWeight: 600, color: method.accent,
                      }}>
                        Get started
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>
                API & Database sync coming soon
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main AddProduct Component
// ─────────────────────────────────────────────

const AddProduct = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const [form, setForm] = useState({
    productId: "",
    productCategoryId: "",
    productName: "",
    therapeuticCategory: "",
    therapeuticSubcategory: "",
    dosageForm: "",
    strength: "",
    warningsPrecautions: "",
    productDescription: "",
    productMarketingUrl: "",

    molecules: [
      {
        moleculeId: null as number | null,
        moleculeName: "",
        mechanismOfAction: "",
        primaryUse: "",
      },
    ],

    packagingId: "",
    packagingUnit: "",
    numberOfUnits: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

    pricingId: "",
    batchLotNumber: "",
    manufacturerName: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    storageCondition: "",
    stockQuantity: "",
    pricePerUnit: "",
    mrp: "",
    createdDate: new Date(),
    gstPercentage: "",
    minimumPurchaseQuantity: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
  });

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [view, setView] = useState<"form" | "list">("form");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await getDrugCategory();
        const options = data.map((cat: any) => ({
          value: cat.categoryId,
          label: cat.categoryName,
        }));
        setCategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (selected: SelectOption | null) => {
    setForm({
      ...form,
      productCategoryId: selected ? String(selected.value) : "",
    });
  };

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.productCategoryId) {
        setSubcategoryOptions([]);
        return;
      }
      try {
        setLoadingSubcategories(true);
        const data = await getTherapeuticSubcategory(form.productCategoryId);
        const options = data.map((sub: any) => ({
          value: sub.subcategoryId,
          label: sub.subcategoryName,
        }));
        setSubcategoryOptions(options);
        setForm((prev) => ({ ...prev, therapeuticSubcategory: "" }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, [form.productCategoryId]);

  const handleSubcategoryChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticSubcategory: selected ? selected.value : "",
    }));
  };

  const handleMoleculeChange = (index: number, value: string) => {
    const updated = [...form.molecules];
    updated[index].moleculeName = value;
    setForm({ ...form, molecules: updated });
  };

  const addMoleculeField = () => {
    setForm({
      ...form,
      molecules: [
        ...form.molecules,
        {
          moleculeId: null,
          moleculeName: "",
          mechanismOfAction: "",
          primaryUse: "",
        },
      ],
    });
  };

  useEffect(() => {
    const fetchMoleculeData = async () => {
      const updated = [...form.molecules];
      for (let i = 0; i < updated.length; i++) {
        const molecule = updated[i];
        if (
          molecule.moleculeName &&
          molecule.moleculeName.length >= 3 &&
          !molecule.mechanismOfAction
        ) {
          try {
            const data = await getMoleculeDesc(molecule.moleculeName);
            updated[i] = {
              ...updated[i],
              moleculeId: data.moleculeId,
              mechanismOfAction: data.mechanismOfAction || "",
              primaryUse: data.primaryUse || "",
            };
          } catch (err) {
            console.error(err);
          }
        }
      }
      setForm((prev) => ({ ...prev, molecules: updated }));
    };
    fetchMoleculeData();
  }, [form.molecules.map((m) => m.moleculeName).join()]);

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );
    return combined.toISOString().slice(0, 19);
  };

  const handleSubmit = async () => {
    const validation = drugProductSchema.safeParse(form);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const fieldName = err.path.join(".");
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null);
      const payload = {
        product: {
          productId: form.productId,
          productName: form.productName,
          therapeuticCategory: form.productCategoryId,
          therapeuticSubcategory: form.therapeuticSubcategory,
          dosageForm: form.dosageForm,
          strength: Number(form.strength),
          warningsPrecautions: form.warningsPrecautions,
          productDescription: form.productDescription,
          productMarketingUrl: form.productMarketingUrl,
        },
        packagingDetails: {
          packagingUnit: form.packagingUnit,
          numberOfUnits: Number(form.numberOfUnits),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [
          {
            batchLotNumber: form.batchLotNumber,
            manufacturerName: form.manufacturerName,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            storageCondition: form.storageCondition,
            stockQuantity: Number(form.stockQuantity),
            pricePerUnit: Number(form.pricePerUnit),
            mrp: Number(form.mrp),
            createdDate: form.createdDate,
            gstPercentage: Number(form.gstPercentage),
            minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
            discountPercentage: Number(form.discountPercentage),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
          },
        ],
        moleculeIds,
      };
      await createDrugProduct(payload);
      alert("Product created successfully!");
      window.location.reload();
    } catch (err) {
      alert("Failed to create product");
    }
  };

  useEffect(() => {
    if ((mode === "edit" || mode === "delete") && selectedProductId) {
      fetchProductByIdAndFillForm(selectedProductId);
    }
  }, [mode, selectedProductId]);

  const fetchProductByIdAndFillForm = async (id: string) => {
    try {
      const data = await getDrugProductById(id);
      if (!data) throw new Error("Product not found");
      const pricing = data.pricingDetails?.[0] || {};
      const packaging = data.packagingDetails || {};
      setForm({
        productId: data.productId || "",
        productCategoryId: String(data.productCategoryId || ""),
        productName: data.productName || "",
        therapeuticCategory: data.productCategoryId || "",
        therapeuticSubcategory: data.therapeuticSubcategory || "",
        dosageForm: data.dosageForm || "",
        strength: String(data.strength ?? ""),
        warningsPrecautions: data.warningsPrecautions || "",
        productDescription: data.productDescription || "",
        productMarketingUrl: data.productMarketingUrl || "",
        molecules:
          data.molecules?.length > 0
            ? data.molecules.map((m: any) => ({
                moleculeId: m.moleculeId ?? null,
                moleculeName: m.moleculeName ?? "",
                mechanismOfAction: m.mechanismOfAction ?? "",
                primaryUse: m.primaryUse ?? "",
              }))
            : [{ moleculeId: null, moleculeName: "", mechanismOfAction: "", primaryUse: "" }],
        packagingUnit: packaging.packagingUnit || "",
        numberOfUnits: String(packaging.numberOfUnits ?? ""),
        packSize: String(packaging.packSize ?? ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
        packagingId: packaging.packagingId || "",
        pricingId: pricing.pricingId || "",
        batchLotNumber: pricing.batchLotNumber || "",
        manufacturerName: pricing.manufacturerName || "",
        manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
        expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
        storageCondition: pricing.storageCondition || "",
        stockQuantity: String(pricing.stockQuantity ?? ""),
        pricePerUnit: String(pricing.pricePerUnit ?? ""),
        mrp: String(pricing.mrp ?? ""),
        createdDate: form.createdDate,
        gstPercentage: String(pricing.gstPercentage ?? ""),
        minimumPurchaseQuantity: String(pricing.minimumPurchaseQuantity ?? ""),
        discountPercentage: String(pricing.discountPercentage ?? ""),
        finalPrice: String(pricing.finalPrice ?? ""),
        hsnCode: String(pricing.hsnCode ?? ""),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load product");
    }
  };

  const handleDelete = async () => {
    if (!form.productId) return;
    const confirmed = confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    try {
      await drugProductDelete(form.productId);
      alert("Product deleted successfully");
      setView("list");
      setMode("create");
      setSelectedProductId(null);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleUpdate = async () => {
    try {
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null);
      const payload = {
        productId: form.productId,
        productCategoryId: form.productCategoryId,
        productName: form.productName,
        therapeuticCategory: form.therapeuticCategory,
        therapeuticSubcategory: form.therapeuticSubcategory,
        dosageForm: form.dosageForm,
        strength: Number(form.strength),
        warningsPrecautions: form.warningsPrecautions,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
        packagingDetails: {
          packagingUnit: form.packagingUnit,
          numberOfUnits: Number(form.numberOfUnits),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [
          {
            pricingId: form.pricingId || undefined,
            batchLotNumber: form.batchLotNumber,
            manufacturerName: form.manufacturerName,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            storageCondition: form.storageCondition,
            stockQuantity: Number(form.stockQuantity),
            pricePerUnit: Number(form.pricePerUnit),
            mrp: Number(form.mrp),
            discountPercentage: Number(form.discountPercentage),
            gstPercentage: Number(form.gstPercentage),
            hsnCode: Number(form.hsnCode),
          },
        ],
        moleculeIds,
      };
      console.log("UPDATE PAYLOAD (FLAT)", payload);
      await editDrugProduct(form.productId, payload as any);
      alert("Product updated successfully");
      setView("list");
      setMode("create");
      setSelectedProductId(null);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const calculateFinalPrice = (mrp: string, discount: string) => {
    const mrpValue = parseFloat(mrp);
    const discountValue = parseFloat(discount);
    if (isNaN(mrpValue)) return "";
    if (!discount || isNaN(discountValue)) {
      return mrpValue.toFixed(2);
    }
    const discounted = mrpValue - (mrpValue * discountValue) / 100;
    return discounted.toFixed(2);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* ── Page header & tabs — always visible above the overlay ── */}
        <div>
          <div className="text-h2 font-normal">Add Product</div>
          <div className="text-label-l4 text-[#1E1E1ECC] mt-1 ">
            Here's Your Current Sales Overview
          </div>
          <div className="space-x-4 mt-6">
            <button className="rounded-lg text-label-l2 font-semibold bg-[#9F75FC] text-white  w-16 h-10">
              Drugs
            </button>
            <button className="rounded-lg text-label-l2 font-semibold bg-neutral-200 text-neutral-500 w-52 h-10">
              Supplements / Nutraceuticals
            </button>
            <button className="rounded-lg text-label-l2 font-semibold bg-neutral-200 text-neutral-500 w-44 h-10">
              Food & Infant Nutrition
            </button>
            <button className="rounded-lg text-label-l2 font-semibold bg-neutral-200 text-neutral-500 w-44 h-10">
              Cosmetic & Personal Use
            </button>
            <button className="rounded-lg text-label-l2 font-semibold bg-neutral-200 text-neutral-500 w-52 h-10">
              Medical Devices & Equipment
            </button>
          </div>
        </div>

        {/* ── Relative wrapper: glass overlay is scoped to this block ── */}
        <div style={{ position: "relative", minHeight: showOnboarding ? 560 : "auto" }}>

          {showOnboarding && (
            <OnboardingOverlay onSelectManual={() => setShowOnboarding(false)} />
          )}

          {/* Product Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold ">
              Product Details
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Therapeutic Category
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={categoryOptions}
                  isLoading={loadingCategories}
                  value={categoryOptions.find((option) => option.value === form.productCategoryId) || null}
                  onChange={handleCategoryChange}
                  placeholder="Select category"
                  isDisabled={mode === "delete"}
                  theme={(theme) => ({
                    ...theme,
                    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
                  })}
                  styles={{
                    control: (base, state) => ({
                      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
                      borderColor: errors.productCategoryId ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
                      boxShadow: "none", cursor: "pointer",
                      "&:hover": { borderColor: errors.productCategoryId ? "#FF3B3B" : "#4B0082" },
                    }),
                    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
                    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
                    dropdownIndicator: (base, state) => ({
                      ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer",
                      "&:hover": { color: "#4B0082" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
                      color: state.isSelected ? "white" : "#1E1E1E", cursor: "pointer",
                      "&:active": { backgroundColor: "#4B0082", color: "white" },
                    }),
                    placeholder: (base) => ({ ...base, color: "#A3A3A3" }),
                    singleValue: (base) => ({ ...base, color: "#1E1E1E" }),
                  }}
                />
                {errors.productCategoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.productCategoryId}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Therapeutic Subcategory
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={subcategoryOptions}
                  isLoading={loadingSubcategories}
                  value={subcategoryOptions.find((option) => option.value === form.therapeuticSubcategory) || null}
                  onChange={handleSubcategoryChange}
                  placeholder="Select subcategory"
                  isDisabled={!form.productCategoryId || mode === "delete"}
                  theme={(theme) => ({
                    ...theme,
                    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
                  })}
                  styles={{
                    control: (base, state) => ({
                      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
                      borderColor: errors.therapeuticSubcategory ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
                      boxShadow: "none", cursor: "pointer",
                      "&:hover": { borderColor: "#4B0082" },
                    }),
                    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
                    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
                    dropdownIndicator: (base, state) => ({
                      ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer",
                      "&:hover": { color: "#4B0082" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
                      color: state.isSelected ? "white" : "#1E1E1E", cursor: "pointer",
                      "&:active": { backgroundColor: "#4B0082", color: "white" },
                    }),
                    placeholder: (base) => ({ ...base, color: "#A3A3A3" }),
                    singleValue: (base) => ({ ...base, color: "#1E1E1E" }),
                  }}
                />
                {errors.therapeuticSubcategory && (
                  <p className="text-red-500 text-sm mt-1">{errors.therapeuticSubcategory}</p>
                )}
              </div>

              <div className="col-span-2">
                <Input
                  label="Product Name" name="productName" id="productName"
                  placeholder="e.g., Paracetamol" onChange={handleChange}
                  value={form.productName} disabled={mode === "delete"}
                  error={errors.productName} required
                />
              </div>

              <Input
                label="Dosage Form (Tablet, Syrup)" name="dosageForm"
                placeholder="e.g., Tablet / Capsule / Syrup / Injection"
                value={form.dosageForm} onChange={handleChange}
                disabled={mode === "delete"} error={errors.dosageForm} required
              />

              <Input
                label="Strength" name="strength" placeholder="e.g., 650 mg"
                value={form.strength} onChange={handleChange}
                disabled={mode === "delete"} error={errors.strength} required
              />

              <div className="col-span-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {form.molecules.map((molecule, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label={`Molecule ${index + 1}`}
                          name={`molecule-${index}`}
                          placeholder="e.g., Paracetamol"
                          required
                          value={molecule.moleculeName}
                          onChange={(e) => handleMoleculeChange(index, e.target.value)}
                          disabled={mode === "delete"}
                        />
                      </div>
                      {index === form.molecules.length - 1 && (
                        <button
                          type="button"
                          onClick={addMoleculeField}
                          className="h-14 w-14 bg-[#4B0082] rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <img src="/icons/PlusIcon.svg" alt="Add" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {form.molecules.some((m) => m.mechanismOfAction || m.primaryUse) && (
                  <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm space-y-4 mt-4">
                    {form.molecules.some((m) => m.mechanismOfAction) && (
                      <div>
                        <div className="font-semibold text-purple-900">Mechanism of Action</div>
                        <div className="text-neutral-700 mt-1">
                          {form.molecules.filter((m) => m.mechanismOfAction).map((m) => m.mechanismOfAction).join(" & ")}
                        </div>
                      </div>
                    )}
                    {form.molecules.some((m) => m.primaryUse) && (
                      <div>
                        <div className="font-semibold text-purple-900">Primary Use</div>
                        <div className="text-neutral-700 mt-1">
                          {form.molecules.filter((m) => m.primaryUse).map((m) => m.primaryUse).join(" & ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Warnings & Precautions
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="warningsPrecautions" id="warningsPrecautions"
                  placeholder="Enter contraindications, side effects, storage conditions"
                  value={form.warningsPrecautions} onChange={handleChange}
                  disabled={mode === "delete"} rows={4}
                  className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.warningsPrecautions
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.warningsPrecautions && (
                  <p className="text-red-500 text-sm mt-1">{errors.warningsPrecautions}</p>
                )}
              </div>

              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Product Description
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="productDescription" id="productDescription"
                  placeholder="Brief product overview, indications, pack details"
                  value={form.productDescription} onChange={handleChange}
                  disabled={mode === "delete"} rows={4}
                  className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.productDescription
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.productDescription && (
                  <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>
                )}
              </div>

              <div className="col-span-2">
                <Input
                  label="Marketing URL" name="productMarketingUrl" id="productMarketingUrl"
                  placeholder="https://" value={form.productMarketingUrl}
                  onChange={handleChange} disabled={mode === "delete"}
                  error={errors.productMarketingUrl} required
                />
              </div>
            </div>
          </div>

          {/* Packaging & Order Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold ">
              Packaging & Order Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <Input label="Packaging Unit" name="packagingUnit" id="packagingUnit" placeholder=""
                value={form.packagingUnit} onChange={handleChange} disabled={mode === "delete"} error={errors.packagingUnit} required />
              <Input label="Number of Units" name="numberOfUnits" id="numberOfUnits" placeholder=""
                value={form.numberOfUnits} onChange={handleChange} disabled={mode === "delete"} error={errors.numberOfUnits} required />
              <Input label="Pack Size" name="packSize" id="packSize" placeholder=""
                value={form.packSize} onChange={handleChange} disabled={mode === "delete"} error={errors.packSize} required />
              <Input label="Min Order Qty" name="minimumOrderQuantity" id="minimumOrderQuantity" placeholder=""
                value={form.minimumOrderQuantity} onChange={handleChange} disabled={mode === "delete"} error={errors.minimumOrderQuantity} required />
              <Input label="Max Order Qty" name="maximumOrderQuantity" id="maximumOrderQuantity" placeholder=""
                value={form.maximumOrderQuantity} onChange={handleChange} disabled={mode === "delete"} error={errors.maximumOrderQuantity} required />
            </div>
          </div>

          {/* Batch, Stock Entry, Pricing & Tax Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold ">
              Batch, Stock Entry, Pricing & Tax Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <Input label="Batch/Lot Number" name="batchLotNumber" id="batchLotNumber" placeholder=""
                value={form.batchLotNumber} onChange={handleChange} disabled={mode === "delete"} error={errors.batchLotNumber} required />
              <Input label="Manufacturer Name" name="manufacturerName" id="manufacturerName" placeholder=""
                value={form.manufacturerName} onChange={handleChange} disabled={mode === "delete"} error={errors.manufacturerName} required />
              <Input
                label="Manufacturing Date" type="date" name="manufacturingDate" id="manufacturingDate" placeholder=""
                onChange={(e) => setForm({ ...form, manufacturingDate: new Date(e.target.value) })}
                value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
                disabled={mode === "delete"} error={errors.manufacturingDate} required
              />
              <Input
                label="Expiry Date" type="date" name="expiryDate" id="expiryDate" placeholder=""
                onChange={(e) => setForm({ ...form, expiryDate: new Date(e.target.value) })}
                value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
                disabled={mode === "delete"} error={errors.expiryDate} required
              />
              <Input label="Storage Condition" name="storageCondition" id="storageCondition" placeholder=""
                value={form.storageCondition} onChange={handleChange} disabled={mode === "delete"} error={errors.storageCondition} required />
              <Input label="Stock Quantity" name="stockQuantity" id="stockQuantity" placeholder=""
                value={form.stockQuantity} onChange={handleChange} disabled={mode === "delete"} error={errors.stockQuantity} required />
              <Input label="Price Per Unit" name="pricePerUnit" id="pricePerUnit" placeholder=""
                value={form.pricePerUnit} onChange={handleChange} disabled={mode === "delete"} error={errors.pricePerUnit} required />
              <Input
                label="MRP" name="mrp" id="mrp" value={form.mrp}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, mrp: value, finalPrice: calculateFinalPrice(value, prev.discountPercentage) }));
                }}
                disabled={mode === "delete"} error={errors.mrp} required
              />
              <Input
                label="Date of Entry" type="date" name="createdDate" id="createdDate" required
                value={form.createdDate ? form.createdDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setForm({ ...form, createdDate: new Date(e.target.value) })}
                disabled={mode === "delete"} error={errors.createdDate}
              />
              <Input label="GST %" name="gstPercentage" id="gstPercentage" placeholder=""
                value={form.gstPercentage} onChange={handleChange} disabled={mode === "delete"} error={errors.gstPercentage} required />

              <div className="py-2 text-label-l4 font-semibold col-span-2">
                Additional Discount (Quantity-based)
              </div>

              <Input label="Minimum Purchase Quantity" name="minimumPurchaseQuantity" id="minimumPurchaseQuantity" placeholder="" />
              <Input
                label="Discount %" name="discountPercentage" id="discountPercentage"
                value={form.discountPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, discountPercentage: value, finalPrice: calculateFinalPrice(prev.mrp, value) }));
                }}
                disabled={mode === "delete"}
              />
              <Input label="Final Price" name="finalPrice" id="finalPrice" value={form.finalPrice} disabled={true} required />
              <Input label="HSN Code" name="hsnCode" id="hsnCode" placeholder=""
                value={form.hsnCode} onChange={handleChange} disabled={mode === "delete"} error={errors.hsnCode} required />

              <div className="col-span-2 flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

        </div>{/* end relative wrapper */}
      </div>
    </>
  );
};

export default AddProduct;