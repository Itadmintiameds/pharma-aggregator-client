import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import { getAllMolecules } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  getDosage,
  getMoleculeStrengthByDosage,
  getPackTypesByDosageId,
  getProductById,
  getStorageConditionsByCategoryId,
  getTherapeuticCategory,
  getTherapeuticSubcategory,
  updateProduct,
  uploadProductImages,
  uploadProductUserManual,
} from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import CommonModal from "../commonComponent/CommonModal";
import AdditionalDiscount from "./AdditionalDiscount";
import UploadInput from "../commonComponent/UploadInput";
import PopupModal from "../commonComponent/PopupModal";

interface SelectOption {
  value: string;
  label: string;
}

interface DrugFormProps {
  categoryId?: number;
  productId?: string;
  mode?: "create" | "edit";
}

export const DrugForm: React.FC<DrugFormProps> = ({
  categoryId,
  productId,
  mode,
}) => {
  type FormState = {
    productId: string;
    categoryId: string;
    productName: string;
    productDescription: string;
    warningsPrecautions: string;

    therapeuticCategoryId: string;
    therapeuticCategory: string;
    therapeuticSubcategoryId: string;
    therapeuticSubcategory: string;
    manufacturerName: string;

    dosageId: number | "";
    strength: string;
    storageConditionIds: number[];

    molecules: {
      moleculeId: string;
      moleculeName: string;
      drugSchedule: string;
      mechanismOfAction: string;
      primaryUse: string;
      strength: string;
    }[];

    packId: string;
    packType: string;
    unitPerPack: string;
    numberOfPacks: string;
    packSize: string;
    minimumOrderQuantity: string;
    maximumOrderQuantity: string;

    pricingId: string;
    batchLotNumber: string;
    manufacturingDate: Date | null;
    expiryDate: Date | null;
    dateOfStockEntry: Date;
    stockQuantity: string;
    sellingPrice: string;
    mrp: string;
    gstPercentage: string;
    discountPercentage: string;
    finalPrice: string;
    hsnCode: string;
    shelfLifeMonths: string;

    // ✅ IMPORTANT FIX
    additionalDiscount: AdditionalDiscountData[];
  };

  const [form, setForm] = useState<FormState>({
    productId: "",
    categoryId: "",
    productName: "",
    productDescription: "",
    warningsPrecautions: "",

    therapeuticCategoryId: "",
    therapeuticCategory: "",
    therapeuticSubcategoryId: "",
    therapeuticSubcategory: "",
    manufacturerName: "",

    dosageId: "" as number | "",
    strength: "",
    storageConditionIds: [],

    molecules: [
      {
        moleculeId: "",
        moleculeName: "",
        drugSchedule: "",
        mechanismOfAction: "",
        primaryUse: "",
        strength: "",
      },
    ],

    packId: "",
    packType: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

    pricingId: "",
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    dateOfStockEntry: new Date(),
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    gstPercentage: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
    shelfLifeMonths: "",
    additionalDiscount: [],
  });

  const initialFormState: FormState = {
    productId: "",
    categoryId: "",
    productName: "",
    productDescription: "",
    warningsPrecautions: "",

    therapeuticCategoryId: "",
    therapeuticCategory: "",
    therapeuticSubcategoryId: "",
    therapeuticSubcategory: "",
    manufacturerName: "",

    dosageId: "",
    strength: "",
    storageConditionIds: [],

    molecules: [
      {
        moleculeId: "",
        moleculeName: "",
        drugSchedule: "",
        mechanismOfAction: "",
        primaryUse: "",
        strength: "",
      },
    ],

    packId: "",
    packType: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

    pricingId: "",
    batchLotNumber: "",
    manufacturingDate: null,
    expiryDate: null,
    dateOfStockEntry: new Date(),
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    gstPercentage: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
    shelfLifeMonths: "",

    additionalDiscount: [],
  };

  const gstOptions = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
  ];

  const [therapeuticCategories, setTherapeuticCategories] = useState<
    SelectOption[]
  >([]);
  const [loadingTherapeuticCategories, setLoadingTherapeuticCategories] =
    useState(false);
  // const [selectedProductId, setSelectedProductId] = useState<string | null>(
  //   null,
  // );
  // const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>(
    [],
  );
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dosageOptions, setDosageOptions] = useState<any[]>([]);
  const [loadingDosage, setLoadingDosage] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [moleculeOptions, setMoleculeOptions] = useState<any[]>([]);
  const [loadingMolecules, setLoadingMolecules] = useState(false);
  const [packTypeOptions, setPackTypeOptions] = useState([]);
  const [strengthFormats, setStrengthFormats] = useState<string[]>([]);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [additionalDiscounts, setAdditionalDiscounts] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const isReadOnly = mode === "edit";
  const [dosageFormLabel, setDosageFormLabel] = useState<string>("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [existingManualFile, setExistingManualFile] = useState<string | null>(
    null,
  );
  const isEditMode = mode === "edit";
  const [storageConditionData, setStorageConditionData] = useState<any[]>([]);
  const [loadingStorageConditions, setLoadingStorageConditions] =
    useState(false);

  useEffect(() => {
    if (categoryId) {
      setForm((prev) => ({
        ...prev,
        categoryId: String(categoryId),
      }));
    }
  }, [categoryId]);

  useEffect(() => {
    const fetchTherapeuticCategories = async () => {
      setLoadingTherapeuticCategories(true);
      try {
        const data = await getTherapeuticCategory();

        const options = data.map((cat: any) => ({
          value: cat.therapeuticCategoryId,
          label: cat.therapeuticCategory,
        }));

        setTherapeuticCategories(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTherapeuticCategories(false);
      }
    };

    fetchTherapeuticCategories();
  }, []);

  const getMinExpiryMonth = () => {
    if (!form.manufacturingDate) return "";

    const mfg = new Date(form.manufacturingDate);

    const min = new Date(mfg.getFullYear(), mfg.getMonth() + 3, 1);

    return `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  };
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { name: string; value: string },
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;

    const finalValue = name === "expiryDate" && value ? new Date(value) : value;

    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: finalValue,
      };

      const unitPerPack = Number(updatedForm.unitPerPack) || 0;
      const numberOfPacks = Number(updatedForm.numberOfPacks) || 0;

      updatedForm.packSize = String(unitPerPack * numberOfPacks);

      // ✅ Cross-field validation
      const minQty = Number(updatedForm.minimumOrderQuantity) || 0;
      const maxQty = Number(updatedForm.maximumOrderQuantity) || 0;

      const mrp = Number(updatedForm.mrp) || 0;
      const sellingPrice = Number(updatedForm.sellingPrice) || 0;
      const discount = Number(updatedForm.discountPercentage);
      const hsn = updatedForm.hsnCode || "";
      const expiry = updatedForm.expiryDate || null;

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        // ✅ Max > Min
        if (maxQty && minQty && maxQty <= minQty) {
          newErrors.maximumOrderQuantity =
            "Max Order Qty must be greater than Min Order Qty";
        } else {
          delete newErrors.maximumOrderQuantity;
        }

        // ✅ Selling Price < MRP
        if (sellingPrice && mrp && sellingPrice >= mrp) {
          newErrors.sellingPrice = "Selling Price must be less than MRP";
        } else {
          delete newErrors.sellingPrice;
        }

        if (name === "discountPercentage") {
          if (value === "") {
            delete newErrors.discountPercentage;
          } else {
            const discountVal = Number(value);

            if (isNaN(discountVal) || discountVal < 0 || discountVal > 100) {
              newErrors.discountPercentage =
                "Discount must be between 0 and 100";

              // ❗ Clear the value if invalid
              updatedForm.discountPercentage = "";
            } else {
              delete newErrors.discountPercentage;
            }
          }
        }

        if (hsn) {
          const isValidLength = [4, 6, 8].includes(hsn.length);
          const isNumeric = /^\d+$/.test(hsn);

          if (!isNumeric || !isValidLength) {
            newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits only";
          } else {
            delete newErrors.hsnCode;
          }
        }

        // if (name === "expiryDate") {
        //   if (value) {
        //     const year = value.split("-")[0];

        //     if (year.length > 4) {
        //       newErrors.expiryDate = "Year must be 4 digits";
        //       return newErrors;
        //     }

        //     const date = new Date(value);

        //     if (isNaN(date.getTime())) {
        //       newErrors.expiryDate = "Invalid date";
        //       return newErrors;
        //     }

        //     const minDate = new Date();
        //     minDate.setMonth(minDate.getMonth() + 3);
        //     minDate.setHours(0, 0, 0, 0);

        //     const normalized = new Date(date);
        //     normalized.setHours(0, 0, 0, 0);

        //     if (normalized < minDate) {
        //       newErrors.expiryDate = "Expiry must be at least 3 months ahead";
        //     } else {
        //       delete newErrors.expiryDate;
        //     }

        //     // ✅ Set expiry date
        //     updatedForm.expiryDate = date;

        //     // ✅ Calculate Shelf Life ONLY if manufacturing date exists
        //     if (updatedForm.manufacturingDate) {
        //       const mfg = new Date(updatedForm.manufacturingDate);

        //       const years = date.getFullYear() - mfg.getFullYear();
        //       const months = date.getMonth() - mfg.getMonth();

        //       const totalMonths = years * 12 + months;

        //       // ✅ Prevent negative shelf life
        //       if (totalMonths >= 0) {
        //         updatedForm.shelfLifeMonths = totalMonths.toString();
        //       } else {
        //         updatedForm.shelfLifeMonths = "";
        //         newErrors.expiryDate =
        //           "Expiry cannot be before Manufacturing Date";
        //       }
        //     }
        //   } else {
        //     updatedForm.expiryDate = null;
        //     updatedForm.shelfLifeMonths = ""; // ✅ reset shelf life
        //   }
        // }

        if (name === "expiryDate") {
          if (value) {
            const [year, month] = value.split("-").map(Number);

            // ✅ Normalize to month start
            const date = new Date(year, month - 1, 1);

            delete newErrors.expiryDate;

            // ✅ Validate ONLY based on Manufacturing Date
            if (updatedForm.manufacturingDate) {
              const mfg = new Date(updatedForm.manufacturingDate);

              const minDate = new Date(
                mfg.getFullYear(),
                mfg.getMonth() + 3,
                1,
              );

              if (date < minDate) {
                newErrors.expiryDate =
                  "Expiry must be at least 3 months after Manufacturing Date";
              }
            }

            // ✅ Set expiry date
            updatedForm.expiryDate = date;

            // ✅ Shelf life calculation (PURE month-based ✅)
            if (updatedForm.manufacturingDate) {
              const mfg = new Date(updatedForm.manufacturingDate);

              const totalMonths =
                (date.getFullYear() - mfg.getFullYear()) * 12 +
                (date.getMonth() - mfg.getMonth());

              if (totalMonths >= 0) {
                updatedForm.shelfLifeMonths = totalMonths.toString();
              } else {
                updatedForm.shelfLifeMonths = "";
                newErrors.expiryDate =
                  "Expiry cannot be before Manufacturing Date";
              }
            }
          } else {
            updatedForm.expiryDate = null;
            updatedForm.shelfLifeMonths = "";
          }
        }
        return newErrors;
      });

      return updatedForm;
    });
  };

  const handleTherapeuticCategoriesChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticCategory: selected ? selected.value : "",
      therapeuticSubcategory: "", // reset
    }));
  };

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.therapeuticCategory) {
        setSubcategoryOptions([]);
        return;
      }

      try {
        setLoadingSubcategories(true);

        const data = await getTherapeuticSubcategory(form.therapeuticCategory);

        const options = data.map((sub: any) => ({
          value: sub.therapeuticSubcategoryId,
          label: sub.therapeuticSubcategory,
        }));

        setSubcategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
  }, [form.therapeuticCategory]);

  const handleSubcategoryChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticSubcategory: selected ? selected.value : "",
    }));
  };

  useEffect(() => {
    const fetchMolecules = async () => {
      try {
        setLoadingMolecules(true);

        const data = await getAllMolecules();

        const formatted = data.map((m: any) => ({
          label: m.moleculeName,
          value: m, // 🔥 store full object
        }));

        setMoleculeOptions(formatted);
      } catch (error) {
        console.error("Error fetching molecules:", error);
      } finally {
        setLoadingMolecules(false);
      }
    };

    fetchMolecules();
  }, []);

  const handleMoleculeSelect = (index: number, selected: any) => {
    const m = selected?.value;
    if (!m) return;

    const selectedId = m.moleculeId;

    // ❌ Check duplicate (excluding current index)
    const isDuplicate = form.molecules.some(
      (mol, i) => i !== index && Number(mol.moleculeId) === Number(selectedId),
    );

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        [`molecules.${index}.moleculeId`]: "Molecule already selected",
      }));
      return;
    }

    // ✅ Clear error if valid
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`molecules.${index}.moleculeId`];
      return newErrors;
    });

    // ✅ Update form (your original logic)
    setForm((prev) => {
      const updated = [...prev.molecules];

      updated[index] = {
        ...updated[index],
        moleculeId: m.moleculeId,
        moleculeName: m.moleculeName,
        drugSchedule: m.drugSchedule,
        mechanismOfAction: m.mechanismOfAction,
        primaryUse: m.primaryUse,
      };

      return {
        ...prev,
        molecules: updated,
      };
    });
  };

  const addMolecule = () => {
    setForm((prev) => ({
      ...prev,
      molecules: [
        ...prev.molecules,
        {
          moleculeId: "",
          moleculeName: "",
          drugSchedule: "",
          mechanismOfAction: "",
          primaryUse: "",
          strength: "",
        },
      ],
    }));
  };

  const handleStrengthChange = (index: number, value: string) => {
    const updated = [...form.molecules];
    updated[index].strength = value;

    setForm((prev) => ({
      ...prev,
      molecules: updated,
    }));
  };

  const getFinalDrugSchedule = (molecules: any[]) => {
    const schedules = molecules.map((m) => m.drugSchedule).filter(Boolean);

    if (schedules.length === 0) return "";

    if (schedules.includes("H1")) return "H1";
    if (schedules.includes("H")) return "H";
    return "OTC";
  };

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
    const validation = drugProductSchema.safeParse({
      ...form,
      images: [...existingImages, ...images], // ✅ FIX
    });

    if (!validation.success) {
      console.log(validation.error.issues);

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
      const payload = {
        productName: form.productName,
        productDescription: form.productDescription,
        warningsPrecautions: form.warningsPrecautions,

        manufacturerName: form.manufacturerName, // ✅ MOVED TO ROOT

        categoryId: Number(form.categoryId), // ✅ FIX

        packagingDetails: [
          {
            packId: Number(form.packId),
            packType: form.packType,
            unitPerPack: Number(form.unitPerPack), // ✅ STRING
            numberOfPacks: Number(form.numberOfPacks),
            packSize: Number(form.packSize),
            minimumOrderQuantity: Number(form.minimumOrderQuantity),
            maximumOrderQuantity: Number(form.maximumOrderQuantity),
          },
        ],

        pricingDetails: [
          {
            batchLotNumber: form.batchLotNumber,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
            sellingPrice: Number(form.sellingPrice),
            mrp: Number(form.mrp),
            discountPercentage: Number(form.discountPercentage),
            gstPercentage: Number(form.gstPercentage),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
            shelfLifeMonths: Number(form.shelfLifeMonths),

            // 🔥 IMPORTANT FIX
            additionalDiscounts: form.additionalDiscount.map((d) => ({
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
            })),
          },
        ],

        productAttributeDrugs: [
          {
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubcategoryId: form.therapeuticSubcategory,

            dosageForm:
              dosageOptions.find((d) => d.value === form.dosageId)?.label || "",

            strength: form.strength,
            storageConditionIds: form.storageConditionIds,

            molecules: form.molecules.map((m) => ({
              moleculeId: Number(m.moleculeId),
              strength: m.strength,
            })),
          },
        ],

        productImages: images.map((img) => ({
          productImage: img.name,
        })),
      };

      const productResponse = await createDrugProduct(payload);
      const productId = productResponse?.data?.productId;

      const productAttributeId =
        productResponse?.data?.productAttributeDrugs?.[0]?.productAttributeId;

      if (!productId) {
        throw new Error("Product ID not returned from backend");
      }

      //Upload User Manual
      if (manualFile && productAttributeId) {
        await uploadProductUserManual(productAttributeId, manualFile);
      }

      //Upload Product Images
      if (images.length > 0) {
        await uploadProductImages(productId, images);
      }
      setShowSuccessModal(true);

      // alert("Product Saved successfully!");
      // window.location.reload();
    } catch (err) {
      console.error("❌ Submit Error:", err);
      alert("❌ Failed to create product");
    }
  };

  const resetForm = () => {
    setForm({
      ...initialFormState,
      dateOfStockEntry: new Date(), // 🔥 always fresh
    });

    setImages([]);
    setErrors({});
    setManualFile(null);
  };

  const handleViewProduct = () => {
    console.log("Go to product page");
    // navigate(`/product/${productId}`) ← if using router
  };

  const handleContinueEditing = () => {
    setShowSuccessModal(false);
  };

  const handleContinueAdding = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const handleBackToDashboard = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (mode === "edit" && productId) {
      fetchProductByIdAndFillForm(productId);
    }
  }, [mode, productId, dosageOptions, moleculeOptions]);

  const fetchProductByIdAndFillForm = async (id: string) => {
    try {
      const data = await getProductById(id);
      if (!data) throw new Error("Product not found");

      const pricing =
        data.pricingDetails?.length > 0
          ? data.pricingDetails.reduce((latest: any, curr: any) =>
              new Date(curr.createdDate) > new Date(latest.createdDate)
                ? curr
                : latest,
            )
          : {};
      const packaging =
        data.packagingDetails?.length > 0
          ? data.packagingDetails.reduce((latest: any, curr: any) =>
              new Date(curr.createdDate) > new Date(latest.createdDate)
                ? curr
                : latest,
            )
          : {};
      const attributeDrug = data.productAttributeDrugs?.[0] || {};
      const dosageForm = attributeDrug.dosageForm || "";
      const selectedDosage = dosageOptions.find(
        (option) => option.label === dosageForm,
      );

      const molecules =
        attributeDrug.molecules?.length > 0
          ? attributeDrug.molecules.map((m: any) => {
              const full = moleculeOptions.find(
                (opt) => opt.value.moleculeId === m.moleculeId,
              )?.value;

              return {
                moleculeId: m.moleculeId ?? "",
                moleculeName: full?.moleculeName || "",
                drugSchedule: full?.drugSchedule || "",
                mechanismOfAction: full?.mechanismOfAction || "",
                primaryUse: full?.primaryUse || "",
                strength: m.strength ?? "",
              };
            })
          : [
              {
                moleculeId: "",
                moleculeName: "",
                drugSchedule: "",
                mechanismOfAction: "",
                primaryUse: "",
                strength: "",
              },
            ];

      setExistingImages(
        data.productImages?.map((img: any) => img.productImage) || [],
      );

      setExistingManualFile(
        data.productAttributeDrugs?.[0]?.userManualUrl || null,
      );
      setForm((prev) => ({
        ...prev,
        productId: data.productId || "",
        categoryId: String(data.categoryId || categoryId || ""),
        productName: data.productName || "",
        productDescription: data.productDescription || "",
        warningsPrecautions: data.warningsPrecautions || "",
        manufacturerName: data.manufacturerName || "",
        therapeuticCategory: String(attributeDrug.therapeuticCategoryId || ""),
        therapeuticSubcategory: String(
          attributeDrug.therapeuticSubcategoryId || "",
        ),
        dosageId: selectedDosage?.value || "",
        strength: String(attributeDrug.strength ?? ""),
        molecules,
        packId: String(packaging.packId || ""),
        packType: packaging.packType || "",
        unitPerPack: String(packaging.unitPerPack ?? ""),
        numberOfPacks: String(packaging.numberOfPacks ?? ""),
        packSize: String(packaging.packSize ?? ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
        pricingId: pricing.pricingId || "",
        batchLotNumber: pricing.batchLotNumber || "",
        manufacturingDate: pricing.manufacturingDate
          ? new Date(pricing.manufacturingDate)
          : null,
        expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
        dateOfStockEntry: pricing.dateOfStockEntry
          ? new Date(pricing.dateOfStockEntry)
          : new Date(),
        storageCondition: pricing.storageCondition || "",
        stockQuantity: String(pricing.stockQuantity ?? ""),
        sellingPrice: String(pricing.sellingPrice ?? ""),
        mrp: String(pricing.mrp ?? ""),
        gstPercentage:
          pricing.gstPercentage !== null && pricing.gstPercentage !== undefined
            ? String(pricing.gstPercentage)
            : "",
        discountPercentage: String(pricing.discountPercentage ?? ""),
        finalPrice: String(pricing.finalPrice ?? ""),
        hsnCode: String(pricing.hsnCode ?? ""),
        shelfLifeMonths: String(pricing.shelfLifeMonths ?? ""),
        additionalDiscount: pricing.additionalDiscounts || [],
      }));

      setDosageFormLabel(dosageForm);
    } catch (err) {
      console.error(err);
      alert("Failed to load product");
    }
  };

  const handleUpdate = async () => {
    const validation = drugProductSchema.safeParse({
      ...form,
      images: [...existingImages, ...images],
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        fieldErrors[err.path.join(".")] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const payload = {
        productId: form.productId, // ✅ IMPORTANT

        productName: form.productName,
        productDescription: form.productDescription,
        warningsPrecautions: form.warningsPrecautions,

        manufacturerName: form.manufacturerName,
        categoryId: Number(form.categoryId),

        packagingDetails: [
          {
            packId: Number(form.packId),
            packType: form.packType,
            unitPerPack: Number(form.unitPerPack),
            numberOfPacks: Number(form.numberOfPacks),
            packSize: Number(form.packSize),
            minimumOrderQuantity: Number(form.minimumOrderQuantity),
            maximumOrderQuantity: Number(form.maximumOrderQuantity),
          },
        ],

        pricingDetails: [
          {
            pricingId: form.pricingId || undefined, // ✅ VERY IMPORTANT FIX

            batchLotNumber: form.batchLotNumber,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),

            sellingPrice: Number(form.sellingPrice),
            mrp: Number(form.mrp),
            discountPercentage: Number(form.discountPercentage),

            // ✅ GST FIX (safe conversion)
            gstPercentage: form.gstPercentage ? Number(form.gstPercentage) : 0,

            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
            shelfLifeMonths: Number(form.shelfLifeMonths),

            additionalDiscounts: form.additionalDiscount.map((d) => ({
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
            })),
          },
        ],

        productAttributeDrugs: [
          {
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubcategoryId: form.therapeuticSubcategory,

            dosageForm:
              dosageOptions.find((d) => d.value === form.dosageId)?.label || "",

            strength: form.strength,
            storageConditionIds: form.storageConditionIds,

            molecules: form.molecules.map((m) => ({
              moleculeId: Number(m.moleculeId),
              strength: m.strength,
            })),
          },
        ],

        productImages: images.map((img) => ({
          productImage: img.name,
        })),
      };

      await updateProduct(form.productId, payload);

      if (images.length > 0) {
        await uploadProductImages(form.productId, images);
      }

      alert("✅ Product updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Update failed");
    }
  };

  const calculateFinalPrice = (
    mrp: string,
    standardDiscount: string,
    gst: string,
    quantity: number,
    additionalDiscounts: AdditionalDiscountData[],
  ) => {
    const mrpValue = parseFloat(mrp);
    const stdDiscount = parseFloat(standardDiscount);
    const gstValue = parseFloat(gst);

    // ✅ ALWAYS RETURN OBJECT
    if (isNaN(mrpValue)) {
      return {
        finalPerUnit: "",
        total: "",
        appliedDiscount: 0,
      };
    }

    let appliedDiscount = stdDiscount;

    const applicableSlab = additionalDiscounts
      .filter((d) => quantity >= d.minimumPurchaseQuantity)
      .sort((a, b) => b.minimumPurchaseQuantity - a.minimumPurchaseQuantity)[0];

    if (applicableSlab) {
      appliedDiscount = applicableSlab.additionalDiscountPercentage;
    }

    const discountedPrice = mrpValue - (mrpValue * appliedDiscount) / 100;
    const finalPerUnit = discountedPrice + (discountedPrice * gstValue) / 100;

    return {
      finalPerUnit: finalPerUnit.toFixed(2),
      total: (finalPerUnit * quantity).toFixed(2),
      appliedDiscount,
    };
  };

  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "56px",
      height: "auto",
      borderRadius: "16px",
      borderColor: errors[errorKey]
        ? "#FF3B3B"
        : state.isFocused
          ? "#4B0082"
          : "#737373",
      boxShadow: "none",
      cursor: "pointer",

      // ✅ FIX: dynamic alignment
      alignItems:
        state.hasValue && state.selectProps.isMulti ? "flex-start" : "center",

      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),

    valueContainer: (base: any) => ({
      ...base,
      padding: "8px 16px", // slight vertical padding for multi-line
      flexWrap: "wrap", // ✅ enables wrapping
      overflow: "visible",
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px", // ✅ keep icon aligned like other fields
    }),

    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),

    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4B0082"
        : state.isFocused
          ? "#F3E8FF"
          : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),

    placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),

    multiValue: (base: any) => ({
      ...base,
      margin: "2px", // neat spacing when wrapping
    }),
  });

  const selectTheme = (theme: any) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#4B0082",
      primary25: "#F3E8FF",
      primary50: "#E9D5FF",
    },
  });

  useEffect(() => {
    const fetchDosage = async () => {
      try {
        setLoadingDosage(true);

        const data = await getDosage();

        const options = data.map((d: any) => ({
          value: d.dosageId, // ✅ important
          label: d.dosageName, // adjust if backend uses different key
        }));

        setDosageOptions(options);
      } catch (error) {
        console.error("Error fetching dosage:", error);
      } finally {
        setLoadingDosage(false);
      }
    };

    fetchDosage();
  }, []);

  const handleDosageChange = async (selected: any) => {
    const dosageId = selected?.value;
    const dosageLabel = selected?.label || "";

    setForm((prev) => ({
      ...prev,
      dosageId,

      molecules: [
        {
          moleculeId: "",
          moleculeName: "",
          drugSchedule: "",
          strength: "",
          mechanismOfAction: "",
          primaryUse: "",
        },
      ],

      packId: "",
      packType: "",
    }));

    setDosageFormLabel(dosageLabel);

    setErrors((prev) => ({
      ...prev,
      molecules: "",
      packId: "",
    }));

    try {
      const data = await getMoleculeStrengthByDosage(dosageId);

      const strengths = data.map((item: any) => item.moleculeStrengthFormat);

      setStrengthFormats(strengths);
    } catch (error) {
      console.error(error);
      setStrengthFormats([]);
    }
  };

  useEffect(() => {
    if (!form.dosageId) return;

    const fetchPackTypes = async () => {
      try {
        const res = await getPackTypesByDosageId(Number(form.dosageId));

        const data = Array.isArray(res) ? res : res?.data;

        const options = data.map((p: any) => ({
          value: p.packId, // ✅ FIXED
          label: p.packType, // ✅ FIXED
        }));

        setPackTypeOptions(options);
      } catch (err) {
        console.error("PackType Error:", err);
      }
    };

    fetchPackTypes();
  }, [form.dosageId]);

  const calculateShelfLife = (mfg: Date, exp: Date) => {
    if (!mfg || !exp) return "";

    const years = exp.getFullYear() - mfg.getFullYear();
    const months = exp.getMonth() - mfg.getMonth();

    const totalMonths = years * 12 + months;

    return totalMonths >= 0 ? totalMonths : "";
  };

  const removeMolecule = (indexToRemove: number) => {
    if (form.molecules.length === 1) {
      alert("At least one molecule is required.");
      return;
    }

    const updated = form.molecules.filter((_, i) => i !== indexToRemove);

    setForm({
      ...form,
      molecules: updated,
    });
  };

  useEffect(() => {
    const fetchStorageConditions = async () => {
      if (!form.categoryId) return;

      try {
        setLoadingStorageConditions(true);

        const data = await getStorageConditionsByCategoryId(
          Number(form.categoryId),
        );

        setStorageConditionData(data);
      } catch (error) {
        console.error("Failed to fetch storage conditions:", error);
      } finally {
        setLoadingStorageConditions(false);
      }
    };

    fetchStorageConditions();
  }, [form.categoryId]);

  const storageConditionOptions = storageConditionData.map((item) => ({
    value: item.storageConditionId,
    label: item.conditionName,
  }));

  return (
    <>
      <PopupModal
        isOpen={showSuccessModal}
        title="Product Saved Successfully!"
        description="Your product has been saved and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Adding"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccessModal(false)}
      />
      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]" // optional
        >
          <div className="h-[80vh] overflow-hidden flex flex-col">
            <AdditionalDiscount
              initialData={form.additionalDiscount}
              onSave={(data) => {
                setForm((prev) => {
                  const result = calculateFinalPrice(
                    prev.mrp,
                    prev.discountPercentage,
                    prev.gstPercentage,
                    Number(prev.minimumOrderQuantity || 1),
                    data || [],
                  );

                  return {
                    ...prev,
                    additionalDiscount: data || [], // ✅ persist slabs
                    finalPrice: result?.finalPerUnit || "",
                  };
                });
              }}
              onClose={() => setShowAdditionalDiscount(false)} // ✅ NEW
            />
          </div>
        </CommonModal>
      )}
      <div>
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Product Details</div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Therapeutic Category
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={therapeuticCategories}
                isLoading={loadingTherapeuticCategories}
                value={
                  therapeuticCategories.find(
                    (o) => o.value === form.therapeuticCategory,
                  ) || null
                }
                onChange={handleTherapeuticCategoriesChange}
                placeholder="Select category"
                isDisabled={isEditMode}
                theme={selectTheme}
                styles={selectStyles("productCategoryId")}
              />
              {errors.therapeuticCategory && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.therapeuticCategory}
                </p>
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
                value={
                  subcategoryOptions.find(
                    (o) => o.value === form.therapeuticSubcategory,
                  ) || null
                }
                onChange={handleSubcategoryChange}
                placeholder="Select subcategory"
                isDisabled={isEditMode}
                theme={selectTheme}
                styles={selectStyles("therapeuticSubcategory")}
              />
              {errors.therapeuticSubcategory && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.therapeuticSubcategory}
                </p>
              )}
            </div>

            <Input
              label="Product Name"
              name="productName"
              id="productName"
              placeholder="e.g., Paracetamol"
              onChange={handleChange}
              value={form.productName}
              readOnly={isEditMode}
              error={errors.productName}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Dosage Form (Tablet, Syrup)
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={dosageOptions}
                isLoading={loadingDosage}
                value={
                  dosageOptions.find((o) => o.value === form.dosageId) || null
                }
                onChange={handleDosageChange}
                placeholder="Select dosage"
                isDisabled={isEditMode}
                theme={selectTheme}
                styles={selectStyles("dosageId")}
              />

              {errors.dosageId && (
                <p className="text-red-500 text-sm mt-1">{errors.dosageId}</p>
              )}
            </div>

            {form.molecules.map((molecule, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_auto] gap-4 col-span-2"
              >
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-label-l3 text-neutral-700 font-semibold">
                    Molecule
                    <span className="text-warning-500 font-semibold ml-1">
                      *
                    </span>
                  </label>

                  <Select
                    options={moleculeOptions}
                    isLoading={loadingMolecules}
                    value={
                      moleculeOptions.find(
                        (o) => o.value.moleculeId === molecule.moleculeId,
                      ) || null
                    }
                    onChange={(selected) =>
                      handleMoleculeSelect(index, selected)
                    }
                    placeholder="Select molecule"
                    theme={selectTheme}
                    styles={{
                      ...selectStyles("molecule"),
                      container: (base) => ({
                        ...base,
                        width: "100%",
                      }),
                    }}
                    isDisabled={isEditMode}
                  />

                  {errors[`molecules.${index}.moleculeId`] && (
                    <p className="text-red-500 text-sm">
                      {errors[`molecules.${index}.moleculeId`]}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <Input
                    label="Molecule Strength"
                    name="strength"
                    placeholder={strengthFormats.join(", ") || "Enter strength"}
                    value={molecule.strength || ""}
                    onChange={(e) =>
                      handleStrengthChange(index, e.target.value)
                    }
                    readOnly={isEditMode}
                    required
                  />
                </div>

                {!isEditMode && (
                  <div className="flex items-end">
                    <button
                      onClick={() => removeMolecule(index)}
                      className="border-2 border-[#FF3B3B] w-11 h-10 rounded-lg flex items-center justify-center"
                    >
                      <img
                        src="/icons/RedMinusIcon.svg"
                        alt="remove"
                        className="w-5 h-5 object-contain"
                      />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!isEditMode && (
              <button
                onClick={addMolecule}
                className="col-span-2 w-41.25 h-10.5 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5"
              >
                <img
                  src="/icons/PlusIcon.svg"
                  alt="drug"
                  className="w-[12.5px] h-[12.5px] rounded-md object-cover"
                />
                Add Molecule
              </button>
            )}
            <Input
              label="Drug Schedule"
              name="drugSchedule"
              placeholder=""
              value={getFinalDrugSchedule(form.molecules)}
              readOnly
              required
            />

            <Input
              label="Mechanism of Action (MoA)"
              name="mechanismOfAction"
              placeholder=""
              value={form.molecules
                .map((m) => m.mechanismOfAction)
                .filter(Boolean)
                .join(" & ")}
              readOnly
              required
            />

            <Input
              label="Primary Use"
              name="primaryUse"
              placeholder=""
              value={form.molecules
                .map((m) => m.primaryUse)
                .filter(Boolean)
                .join(" & ")}
              readOnly
              required
            />

            <UploadInput
              onFileSelect={setManualFile}
              existingFile={existingManualFile || undefined}
            />
            {/* <Input
              label="Storage Condition"
              name="storageCondition"
              id="storageCondition"
              placeholder=""
              value={form.storageCondition}
              onChange={handleChange}
              error={errors.storageCondition}
              required
            /> */}

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Storage Condition
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

              <Select
                options={storageConditionOptions}
                isLoading={loadingStorageConditions}
                isMulti // ✅ important for multi-select
                value={storageConditionOptions.filter((o) =>
                  form.storageConditionIds.includes(o.value),
                )}
                onChange={(selectedOptions) => {
                  const ids = selectedOptions
                    ? selectedOptions.map((opt: any) => opt.value)
                    : [];

                  setForm((prev) => ({
                    ...prev,
                    storageConditionIds: ids,
                  }));
                }}
                placeholder="Select storage conditions"
                theme={selectTheme}
                styles={selectStyles("storageConditionIds")}
              />

              {errors.storageConditionIds && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.storageConditionIds}
                </p>
              )}
            </div>

            <Input
              label="Manufacturer Name"
              name="manufacturerName"
              id="manufacturerName"
              placeholder=""
              value={form.manufacturerName}
              onChange={handleChange}
              readOnly={isEditMode}
              error={errors.manufacturerName}
              required
            />

            <div>
              <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                Warnings & Precautions
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <textarea
                name="warningsPrecautions"
                id="warningsPrecautions"
                placeholder="Enter contraindications, side effects, storage conditions"
                value={form.warningsPrecautions}
                onChange={handleChange}
                // disabled={mode === "delete"}
                rows={4}
                className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
                  errors.warningsPrecautions
                    ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                    : "border-neutral-500 focus:border-[#4B0082]"
                } focus:outline-none focus:ring-0`}
              />
              {errors.warningsPrecautions && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.warningsPrecautions}
                </p>
              )}
            </div>

            <div>
              <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                Product Description
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <textarea
                name="productDescription"
                id="productDescription"
                placeholder="Brief product overview, indications, pack details"
                value={form.productDescription}
                onChange={handleChange}
                // disabled={mode === "delete"}
                rows={4}
                className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
                  errors.productDescription
                    ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                    : "border-neutral-500 focus:border-[#4B0082]"
                } focus:outline-none focus:ring-0`}
              />
              {errors.productDescription && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.productDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Packaging & Order Details</div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Pack Type
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

              <Select
                options={packTypeOptions}
                value={
                  packTypeOptions.find(
                    (o: any) => String(o.value) === String(form.packId),
                  ) || null
                }
                onChange={(selected: any) =>
                  setForm((prev) => ({
                    ...prev,
                    packId: selected?.value || "", // ✅ FIX
                    packType: selected?.label || "",
                  }))
                }
                placeholder="Select Pack Type"
                isDisabled={isEditMode || !form.dosageId}
                theme={selectTheme}
                styles={selectStyles("packId")}
              />
              {errors.packId && (
                <p className="text-red-500 text-sm mt-1">{errors.packId}</p>
              )}
            </div>

            <Input
              type="number"
              label="Number of Units per Pack Type"
              name="unitPerPack"
              id="unitPerPack"
              placeholder=""
              value={form.unitPerPack}
              onChange={handleChange}
              // disabled={mode === "delete"}
              error={errors.unitPerPack}
              required
              min={1}
              step={1}
            />

            <Input
              type="number"
              label="Number of Packs"
              name="numberOfPacks"
              id="numberOfPacks"
              placeholder=""
              value={form.numberOfPacks}
              onChange={handleChange}
              // disabled={mode === "delete"}
              error={errors.numberOfPacks}
              required
              min={1}
              step={1}
            />

            <Input
              type="number"
              label="Pack Size (No. of packs X No. of Units per pack type)"
              name="packSize"
              id="packSize"
              placeholder=""
              value={form.packSize}
              onChange={handleChange}
              // disabled={mode === "delete"}
              readOnly
              required
            />

            <div className="text-h6 font-normal col-span-2 mt-3">
              Order Details
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="Min Order Qty"
              name="minimumOrderQuantity"
              id="minimumOrderQuantity"
              placeholder=""
              value={form.minimumOrderQuantity}
              onChange={handleChange}
              // disabled={mode === "delete"}
              min={1}
              step={1}
              error={errors.minimumOrderQuantity}
              required
            />
            <Input
              type="number"
              label="Max Order Qty"
              name="maximumOrderQuantity"
              id="maximumOrderQuantity"
              placeholder=""
              value={form.maximumOrderQuantity}
              onChange={handleChange}
              // disabled={mode === "delete"}
              min={1}
              step={1}
              error={errors.maximumOrderQuantity}
              required
            />

            <div className="text-h6 font-normal col-span-2 mt-3">
              Batch Management
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              label="Batch/Lot Number"
              name="batchLotNumber"
              id="batchLotNumber"
              placeholder=""
              value={form.batchLotNumber}
              onChange={handleChange}
              readOnly={isEditMode}
              error={errors.batchLotNumber}
              required
            />

            {/* <Input
              label="Manufacturing Date"
              type="month"
              name="manufacturingDate"
              id="manufacturingDate"
              placeholder=""
              readOnly={isEditMode}
              onChange={(e) => {
                const value = e.target.value;

                // Prevent year > 4 digits
                const year = value.split("-")[0];
                if (year && year.length > 4) {
                  setErrors({
                    ...errors,
                    manufacturingDate: "Year must be 4 digits",
                  });
                  return;
                }

                const date = new Date(value);

                if (isNaN(date.getTime())) {
                  setErrors({
                    ...errors,
                    manufacturingDate: "Invalid date",
                  });
                  return;
                }

                // ✅ NEW: Prevent future dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const normalized = new Date(date);
                normalized.setHours(0, 0, 0, 0);

                if (normalized > today) {
                  setErrors({
                    ...errors,
                    manufacturingDate:
                      "Manufacturing date cannot be in the future",
                  });
                  return;
                }

                // ✅ Clear error
                setErrors({
                  ...errors,
                  manufacturingDate: "",
                });

                // ✅ Calculate Shelf Life if expiry exists
                let newShelfLife = "";

                if (form.expiryDate) {
                  const exp = new Date(form.expiryDate);

                  const years = exp.getFullYear() - date.getFullYear();
                  const months = exp.getMonth() - date.getMonth();

                  let totalMonths = years * 12 + months;

                  if (exp.getDate() < date.getDate()) {
                    totalMonths -= 1;
                  }

                  if (totalMonths >= 0) {
                    newShelfLife = totalMonths.toString();
                  } else {
                    newShelfLife = "";
                    setErrors((prev) => ({
                      ...prev,
                      manufacturingDate: "MFG cannot be after Expiry",
                    }));
                  }
                }

                // ✅ Update form
                setForm({
                  ...form,
                  manufacturingDate: date,
                  shelfLifeMonths: newShelfLife,
                });
              }}
              value={
                form.manufacturingDate &&
                !isNaN(form.manufacturingDate.getTime())
                  ? form.manufacturingDate.toISOString().split("T")[0]
                  : ""
              }
              error={errors.manufacturingDate}
              required
            /> */}

            {/* <Input
              label="Expiry Date"
              type="date"
              name="expiryDate"
              value={
                form.expiryDate && !isNaN(form.expiryDate.getTime())
                  ? form.expiryDate.toISOString().split("T")[0]
                  : ""
              }
              readOnly={isEditMode}
              onChange={handleChange}
              min={getMinExpiryDate()}
              // disabled={mode === "delete"}
              error={errors.expiryDate}
              required
            /> */}


            <Input
              label="Manufacturing Date"
              type="month"
              name="manufacturingDate"
              id="manufacturingDate"
              readOnly={isEditMode}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;

                const [year, month] = value.split("-").map(Number);
                const date = new Date(year, month - 1, 1);

                const today = new Date();
                const currentMonth = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1,
                );

                if (date > currentMonth) {
                  setErrors({
                    ...errors,
                    manufacturingDate:
                      "Manufacturing date cannot be in the future month",
                  });
                  return;
                }

                // ✅ Clear errors
                setErrors((prev) => ({
                  ...prev,
                  manufacturingDate: "",
                  expiryDate: "", // optional: clear expiry error too
                }));

                // 🔥 ALWAYS RESET expiry + shelf life
                setForm({
                  ...form,
                  manufacturingDate: date,
                  expiryDate: null, // ✅ cleared
                  shelfLifeMonths: "", // ✅ cleared
                });
              }}
              value={
                form.manufacturingDate instanceof Date &&
                !isNaN(form.manufacturingDate.getTime())
                  ? `${form.manufacturingDate.getFullYear()}-${String(
                      form.manufacturingDate.getMonth() + 1,
                    ).padStart(2, "0")}`
                  : ""
              }
              error={errors.manufacturingDate}
              required
            />

            <Input
              label="Expiry Date"
              type="month" // ✅ changed
              name="expiryDate"
              value={
                form.expiryDate instanceof Date &&
                !isNaN(form.expiryDate.getTime())
                  ? `${form.expiryDate.getFullYear()}-${String(
                      form.expiryDate.getMonth() + 1,
                    ).padStart(2, "0")}`
                  : ""
              }
              readOnly={isEditMode}
              onChange={handleChange}
              min={getMinExpiryMonth()} // ✅ update this too
              error={errors.expiryDate}
              required
            />

            <Input
              type="number"
              label="Shelf Life (In Months)"
              name="shelfLifeMonths"
              id="shelfLifeMonths"
              value={form.shelfLifeMonths}
              readOnly
              error={errors.shelfLifeMonths}
              required
            />

            <Input
              label="Date of Entry"
              type="date"
              name="dateOfStockEntry"
              id="dateOfStockEntry"
              placeholder=""
              onChange={(e) =>
                setForm({ ...form, dateOfStockEntry: new Date(e.target.value) })
              }
              value={
                form.dateOfStockEntry
                  ? form.dateOfStockEntry.toISOString().split("T")[0]
                  : ""
              }
              disabled
              error={errors.dateOfStockEntry}
              required
            />

            <Input
              type="number"
              label="Stock Quantity"
              name="stockQuantity"
              id="stockQuantity"
              placeholder=""
              value={form.stockQuantity}
              onChange={handleChange}
              readOnly={isEditMode}
              min={1}
              step={1}
              error={errors.stockQuantity}
              required
            />

            <div className="text-h6 font-normal col-span-2 mt-3">Pricing</div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="MRP"
              name="mrp"
              id="mrp"
              placeholder=""
              value={form.mrp}
              onChange={handleChange}
              // disabled={mode === "delete"}
              min={1}
              step={1}
              error={errors.mrp}
              required
            />

            <Input
              type="number"
              label="Selling Price per Pack Size"
              name="sellingPrice"
              id="sellingPrice"
              placeholder=""
              value={form.sellingPrice}
              onChange={handleChange}
              // disabled={mode === "delete"}
              min={1}
              step={1}
              error={errors.sellingPrice}
              required
            />

            <div className="col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Discount Percentage"
                  name="discountPercentage"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  step={1}
                  error={errors.discountPercentage}
                  required
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowAdditionalDiscount(true)}
                  className="w-55.5 h-10.5 px-6 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img
                    src="/icons/PlusIcon.svg"
                    alt="drug"
                    className="w-[12.5px] h-[12.5px]"
                  />
                  Add Special Discount
                </button>
              </div>
            </div>
            <div className="text-h6 font-normal col-span-2 mt-3">
              TAX & BILLING
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                GST %
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

              <Select
                options={gstOptions}
                value={
                  gstOptions.find((o) => o.value === form.gstPercentage) ||
                  (form.gstPercentage
                    ? {
                        value: form.gstPercentage,
                        label: `${form.gstPercentage}%`,
                      }
                    : null)
                }
                onChange={(selected: any) =>
                  setForm((prev) => ({
                    ...prev,
                    gstPercentage: selected?.value || "",
                  }))
                }
                placeholder="Select GST %"
                isDisabled={isEditMode}
                theme={selectTheme}
                styles={selectStyles("gstPercentage")}
              />

              {errors.gstPercentage && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.gstPercentage}
                </p>
              )}
            </div>

            <Input
              type="number"
              label="HSN Code"
              name="hsnCode"
              id="hsnCode"
              placeholder=""
              value={form.hsnCode}
              onChange={handleChange}
              min={1}
              step={1}
              maxLength={8}
              readOnly={isEditMode}
              error={errors.hsnCode}
              required
            />
          </div>
        </div>

        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-[#364153] font-normal text-sm">
            Product Photos{" "}
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </div>

          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => {
              if (!isReadOnly || mode === "edit") {
                document.getElementById("fileInput")?.click();
              }
            }}
          >
            <input
              id="fileInput"
              type="file"
              disabled={isReadOnly && mode !== "edit"}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);

                  const totalFiles =
                    images.length + existingImages.length + newFiles.length;

                  if (totalFiles > 5) {
                    setErrors((prev) => ({
                      ...prev,
                      images: "Maximum 5 images are allowed",
                    }));

                    const remainingSlots =
                      5 - (images.length + existingImages.length);

                    const allowedFiles = newFiles.slice(0, remainingSlots);

                    if (allowedFiles.length > 0) {
                      setImages((prev) => [...prev, ...allowedFiles]);
                    }

                    return;
                  }

                  setErrors((prev) => ({
                    ...prev,
                    images: "",
                  }));

                  setImages((prev) => [...prev, ...newFiles]);
                }
              }}
            />

            <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
              <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center ">
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/icons/FolderIcon.svg"
                    alt="drug"
                    className="w-10 h-10 rounded-md object-cover"
                  />

                  <div className="text-label-l2 font-normal mt-4">
                    Choose a file or drag & drop it here
                  </div>
                  <div className="text-label-l1 font-normal text-neutral-400">
                    or click to browse JPEG, PNG, and Pdf{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errors.images && (
            <div className="text-red-500 text-sm mt-2">{errors.images}</div>
          )}

          <div className="flex gap-4">
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={img}
                      alt="product"
                      className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                    />

                    {!isReadOnly && (
                      <button
                        onClick={() =>
                          setExistingImages(
                            existingImages.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute top-1 right-1 text-[#1E1E1D] cursor-pointer text-xs px-1 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((file, index) => (
                  <div key={index} className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                    />

                    {(!isReadOnly || mode === "edit") && (
                      <button
                        onClick={() =>
                          setImages(images.filter((_, i) => i !== index))
                        }
                        className="absolute top-1 right-1 text-[#1E1E1D] cursor-pointer text-xs px-1 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6 col-span-2">
          <div className="space-x-6 flex">
            <button
              onClick={() => window.location.reload()}
              className="w-21 h-12 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer"
            >
              Cancel
            </button>

            <button className="w-35.25 h-12 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5">
              <img
                src="/icons/SaveDraftIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover"
              />
              Save Draft
            </button>
          </div>
          <div>
            {/* {mode === "delete" ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
              >
                Delete
              </button>
            ) :  */}
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
              >
                Update
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
              >
                Submit
              </button>
            )}
          </div>
        </div>
        {/* </div> */}
      </div>
    </>
  );
};
