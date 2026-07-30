import Input from "@/src/app/commonComponents/Input";
import {
  drugProductSchema,
  drugProductCreateSchema,
} from "@/src/schema/product/DrugProductSchema";
import {
  getAllMolecules,
  getMoleculeByTherapeuticSubcategoryId,
} from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  getDosage,
  getMoleculeStrengthByDosage,
  getPackTypesByDosageId,
  getProductById,
  getStorageConditionsByCategoryId,
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
import AppliedOffersView from "./AppliedOffersView";
import AddDiscNew from "./AdditionalDiscountNew";
import AdditionalDiscountType from "./AdditionalDiscountType";
import {
  getTherapeuticCategory,
  getTherapeuticSubcategory,
} from "@/src/services/product/TherapeuticCategoryService";
import { getSupplementDosageForms } from "@/src/services/product/SupplementService";
import { useRouter } from "next/navigation";
import { validateBatchNumber } from "@/src/services/product/PricingService";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";
import NumericInputWithUnit from "@/src/app/commonComponents/NumericInputWithUnit";
import { getPackTypeUnits } from "@/src/services/product/PackTypeService";

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
      moleculeStrengthFormat: string;
      drugSchedule: string;
      mechanismOfAction: string;
      primaryUse: string;
      strength: string;
    }[];

    packId: string;
    packType: string;
    packTypeUnit: string;
    packTypeUnitId: string;
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
        moleculeStrengthFormat: "",
        drugSchedule: "",
        mechanismOfAction: "",
        primaryUse: "",
        strength: "",
      },
    ],

    packId: "",
    packType: "",
    packTypeUnit: "",
    packTypeUnitId: "",
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
        moleculeStrengthFormat: "",
        drugSchedule: "",
        mechanismOfAction: "",
        primaryUse: "",
        strength: "",
      },
    ],

    packId: "",
    packType: "",
    packTypeUnit: "",
    packTypeUnitId: "",
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

  const router = useRouter();
  const [therapeuticCategories, setTherapeuticCategories] = useState<
    SelectOption[]
  >([]);
  const [loadingTherapeuticCategories, setLoadingTherapeuticCategories] =
    useState(false);

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
  const [allMoleculeMap, setAllMoleculeMap] = useState<Record<string, any>>({});
  const [packTypeOptions, setPackTypeOptions] = useState([]);
  const [strengthFormats, setStrengthFormats] = useState<string[]>([]);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [editTab, setEditTab] = useState<"additional_discount" | "special_schemes" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [additionalDiscounts, setAdditionalDiscounts] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const isReadOnly = mode === "edit";
  const [dosageFormLabel, setDosageFormLabel] = useState<string>("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(
    null,
  );
  const [existingManualFile, setExistingManualFile] = useState<string | null>(
    null,
  );
  const isEditMode = mode === "edit";
  const [storageConditionData, setStorageConditionData] = useState<any[]>([]);
  const [loadingStorageConditions, setLoadingStorageConditions] =
    useState(false);

  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [productAttributeId, setProductAttributeId] = useState<string | null>(
    null,
  );
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] =
    useState(false);
  const [packTypeUnitOptions, setPackTypeUnitOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (categoryId) {
      setForm((prev) => ({
        ...prev,
        categoryId: String(categoryId),
      }));
    }
  }, [categoryId]);

  const fetchTherapeuticCategories = async (id: string | number) => {
    setLoadingTherapeuticCategories(true);

    try {
      const data = await getTherapeuticCategory(id);

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

  useEffect(() => {
    if (categoryId !== undefined) {
      fetchTherapeuticCategories(categoryId);
    }
  }, [categoryId]);

  const getMinExpiryMonth = () => {
    if (!form.manufacturingDate) return "";

    const mfg = new Date(form.manufacturingDate);

    const min = new Date(mfg.getFullYear(), mfg.getMonth() + 3, 1);

    return `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  };

  const getMaxExpiryMonth = () => {
    if (!form.manufacturingDate) return "";

    const mfg = new Date(form.manufacturingDate);

    const maxDate = new Date(mfg.getFullYear() + 5, mfg.getMonth(), 1);

    return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  };

  //Molecule Strent Format -  Maybe required in future
  // const validateStrengthFormat = (value: string) => {
  //   if (!value.trim()) return "Strength is required";

  //   const normalizedValue = value.toLowerCase().trim();

  //   const isValid = strengthFormats.some((format) =>
  //     normalizedValue.endsWith(format.toLowerCase().trim()),
  //   );

  //   if (!isValid) {
  //     return `Invalid strength format. Allowed strengths: ${strengthFormats.join(", ")}`;
  //   }

  //   return "";
  // };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { name: string; value: string },
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;

    if (name === "mrp" || name === "sellingPrice") {
      // Prevent starting with decimal point
      if (value.startsWith(".")) {
        return;
      }

      // Max length 16
      if (value.length > 16) {
        return;
      }

      // Allow digits + one decimal point + up to 2 decimal places
      if (!/^\d*\.?\d{0,2}$/.test(value)) {
        return;
      }
    }

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
      const hsn = updatedForm.hsnCode || "";
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        // ✅ Max > Min
        if (maxQty && minQty && maxQty < minQty) {
          newErrors.maximumOrderQuantity =
            "Max Order Qty must be greater than Min Order Qty";
        } else {
          delete newErrors.maximumOrderQuantity;
        }

        // ✅ Stock Qty >= Min Order Qty
        const stockQty = Number(updatedForm.stockQuantity) || 0;

        if (stockQty && minQty && stockQty < minQty) {
          newErrors.stockQuantity =
            "Stock Quantity must be greater than or equal to Min Order Qty";
        } else {
          delete newErrors.stockQuantity;
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

        if (name === "batchLotNumber" && value.trim()) {
          checkBatchNumber(value);
        }

        return newErrors;
      });

      return updatedForm;
    });
  };

  const checkBatchNumber = async (batchLotNumber: string) => {
    try {
      const response = await validateBatchNumber(
        batchLotNumber,
        Number(form.categoryId),
      );

      if (response.exists) {
        setErrors((prev) => ({
          ...prev,
          batchLotNumber: "Batch number already exists",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          batchLotNumber: "",
        }));
      }
    } catch (error) {
      console.error("Batch validation failed:", error);
    }
  };

  const handleTherapeuticCategoriesChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticCategory: selected ? selected.value : "",
      therapeuticSubcategoryId: "",
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
    const value = selected ? String(selected.value) : "";

    setForm((prev) => ({
      ...prev,
      therapeuticSubcategoryId: value,
      therapeuticSubcategory: value,
    }));
  };

  useEffect(() => {
    const loadAllMolecules = async () => {
      try {
        const data = await getAllMolecules();
        const map = Object.fromEntries(
          (Array.isArray(data) ? data : []).map((m: any) => [
            String(m.moleculeId),
            m,
          ]),
        );
        setAllMoleculeMap(map);
      } catch (error) {
        console.error("Error fetching all molecules:", error);
      }
    };

    loadAllMolecules();
  }, []);

  useEffect(() => {
    if (!form.therapeuticSubcategoryId) {
      setMoleculeOptions([]);
      return;
    }

    const fetchMolecules = async () => {
      try {
        setLoadingMolecules(true);

        const molecules = await getMoleculeByTherapeuticSubcategoryId(
          form.therapeuticSubcategoryId,
        );

        const enrichedMolecules = (
          Array.isArray(molecules) ? molecules : []
        ).map((m: any) => {
          const fullMolecule = allMoleculeMap[String(m.moleculeId)] || m;

          return {
            label: fullMolecule.moleculeName || m.moleculeName,
            value: fullMolecule,
          };
        });

        setMoleculeOptions(enrichedMolecules);
      } catch (error) {
        console.error("Error fetching molecules:", error);
        setMoleculeOptions([]);
      } finally {
        setLoadingMolecules(false);
      }
    };

    fetchMolecules();
  }, [form.therapeuticSubcategoryId]);

  const handleMoleculeSelect = (index: number, selected: any) => {
    const m = selected?.value;
    if (!m) return;

    const selectedId = m.moleculeId;

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

    const fullMolecule = (
      selected?.value && typeof selected.value === "object"
        ? selected.value
        : allMoleculeMap[String(m.moleculeId)] || m
    ) as any;

    // ✅ Update form (your original logic)
    setForm((prev) => {
      const updated = [...prev.molecules];

      updated[index] = {
        ...updated[index],
        moleculeId: fullMolecule.moleculeId || "",
        moleculeName: fullMolecule.moleculeName || "",
        moleculeStrengthFormat: fullMolecule.moleculeStrengthFormat || "",
        drugSchedule: fullMolecule.drugSchedule || "",
        mechanismOfAction: fullMolecule.mechanismOfAction || "",
        primaryUse: fullMolecule.primaryUse || "",
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
          moleculeStrengthFormat: "",
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

    // ✅ Strength validation
    // const strengthError = validateStrengthFormat(value);

    // setErrors((prev) => {
    //   const newErrors = { ...prev };

    //   if (strengthError) {
    //     newErrors[`molecules.${index}.strength`] = strengthError;
    //   } else {
    //     delete newErrors[`molecules.${index}.strength`];
    //   }

    //   return newErrors;
    // });
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
    const validation = drugProductCreateSchema.safeParse({
      ...form,
      images: [...existingImages, ...images],
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

        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),

        // Packaging (variant) and pricing (batch/stock) are intentionally omitted here —
        // they're attached afterwards from the product view page via addPackagingVariant/addStock.

        productAttributeDrugs: [
          {
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubcategoryId:
              form.therapeuticSubcategoryId || form.therapeuticSubcategory,

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
      setCreatedProductId(productId);
      setModalType("create");
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
    const id = form.productId || createdProductId;
    router.push(
      id
        ? `/seller_7a3b9f2c/products/view/${id}`
        : "/seller_7a3b9f2c/products",
    );
  };

  const handleContinueEditing = () => {
    setShowSuccessModal(false);
  };

  const handleContinueAdding = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    router.push("/seller_7a3b9f2c/dashboard");
  };

  useEffect(() => {
    if (mode === "edit" && productId) {
      fetchProductByIdAndFillForm(productId);
    }
  }, [mode, productId]);

  const fetchProductByIdAndFillForm = async (id: string) => {
    try {
      const data = await getProductById(id);
      if (!data) throw new Error("Product not found");
      await fetchTherapeuticCategories(data.categoryId);
      const fetchedDosageOptions = await fetchDosage(data.categoryId);
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
      setProductAttributeId(attributeDrug.productAttributeId || null);

      const dosageForm = attributeDrug.dosageForm?.trim().toLowerCase() || "";
      const therapeuticSubcategoryId = String(
        attributeDrug.therapeuticSubcategoryId || "",
      );

      let fetchedMolecules: any[] = [];
      let fullMoleculeMap = allMoleculeMap;

      if (!Object.keys(fullMoleculeMap).length) {
        try {
          const allMolecules = await getAllMolecules();
          fullMoleculeMap = Object.fromEntries(
            (Array.isArray(allMolecules) ? allMolecules : []).map((m: any) => [
              String(m.moleculeId),
              m,
            ]),
          );
          setAllMoleculeMap(fullMoleculeMap);
        } catch (error) {
          console.error(
            "Error fetching all molecules for edit prefill:",
            error,
          );
        }
      }

      if (therapeuticSubcategoryId) {
        const response = await getMoleculeByTherapeuticSubcategoryId(
          therapeuticSubcategoryId,
        );
        fetchedMolecules = Array.isArray(response)
          ? response
          : response?.data || response?.result || [];

        setMoleculeOptions(
          fetchedMolecules.map((m: any) => {
            const fullMolecule = fullMoleculeMap[String(m.moleculeId)] || m;

            return {
              label: fullMolecule.moleculeName || m.moleculeName,
              value: fullMolecule,
            };
          }),
        );
      }

      const selectedDosage = fetchedDosageOptions.find(
        (option: any) => option.label?.trim().toLowerCase() === dosageForm,
      );
      const molecules =
        attributeDrug.molecules?.length > 0
          ? attributeDrug.molecules.map((m: any) => {
              const full =
                fullMoleculeMap[String(m.moleculeId)] ||
                fetchedMolecules.find(
                  (opt: any) => String(opt.moleculeId) === String(m.moleculeId),
                ) ||
                moleculeOptions.find(
                  (opt) =>
                    String(opt.value.moleculeId) === String(m.moleculeId),
                )?.value;

              return {
                moleculeId: m.moleculeId ?? "",
                moleculeName: full?.moleculeName || "",
                moleculeStrengthFormat: full?.moleculeStrengthFormat || "",
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
                moleculeStrengthFormat: "",
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
        therapeuticSubcategoryId: String(
          attributeDrug.therapeuticSubcategoryId || "",
        ),
        therapeuticSubcategory: String(
          attributeDrug.therapeuticSubcategoryId || "",
        ),
        dosageId: selectedDosage ? Number(selectedDosage.value) : "",
        strength: String(attributeDrug.strength ?? ""),
        storageConditionIds: attributeDrug.storageConditionIds || [],

        molecules,
        packId: String(packaging.packId || ""),
        packType: packaging.packType || "",
        unitPerPack: String(packaging.unitPerPack ?? ""),
        packTypeUnitId: String(packaging.packTypeUnitId ?? ""),
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
        stockQuantity: String(pricing.stockQuantity ?? ""),
        sellingPrice: String(pricing.sellingPrice ?? ""),
        mrp: String(pricing.mrp ?? ""),
        gstPercentage: (() => {
          const resolvedGst =
            pricing.gstPercentage ?? attributeDrug.gstPercentage ?? data.gstPercentage;
          return resolvedGst !== null && resolvedGst !== undefined ? String(resolvedGst) : "";
        })(),
        discountPercentage: String(pricing.discountPercentage ?? ""),
        finalPrice: String(pricing.finalPrice ?? ""),
        hsnCode: String(pricing.hsnCode ?? attributeDrug.hsnCode ?? data.hsnCode ?? ""),
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
  const validation = drugProductCreateSchema.safeParse({
    ...form,
    images: [...existingImages, ...images],
  });

  if (!validation.success) {
    console.log("VALIDATION FAILED:", validation.error.issues);
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

        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),

        productAttributeDrugs: [
          {
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubcategoryId:
              form.therapeuticSubcategoryId || form.therapeuticSubcategory,

            dosageForm:
              dosageOptions.find(
                (d) => Number(d.value) === Number(form.dosageId),
              )?.label || "",

            strength: form.strength,
            storageConditionIds: form.storageConditionIds,

            molecules: form.molecules.map((m) => ({
              moleculeId: Number(m.moleculeId),
              strength: m.strength,
            })),
          },
        ],
        retainedImageUrls: existingImages,
      };

      await updateProduct(form.productId, payload);

      if (productAttributeId && manualFile) {
        await uploadProductUserManual(productAttributeId, manualFile);
      }

      if (images.length > 0) {
        await uploadProductImages(form.productId, images);
      }

      setModalType("update");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert("❌ Update failed");
    }
  };


  const fetchDosage = async (
    categoryId: string | number,
  ): Promise<{ value: string; label: string }[]> => {
    try {
      setLoadingDosage(true);

      const data = await getSupplementDosageForms(categoryId);

      const options = data.map((d: any) => ({
        value: String(d.dosageId),
        label: d.dosageName,
      }));

      setDosageOptions(options);

      return options;
    } catch (error) {
      console.error("Error fetching dosage:", error);
      return [];
    } finally {
      setLoadingDosage(false);
    }
  };

  useEffect(() => {
    if (categoryId !== undefined) {
      fetchDosage(categoryId);
    }
  }, [categoryId]);

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
          moleculeStrengthFormat: "",
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

 

  useEffect(() => {
    fetchPackTypeUnits();
  }, []);

  const fetchPackTypeUnits = async () => {
    try {
      const response = await getPackTypeUnits();

      const options = response.map((item: any) => ({
        label: item.packTypeUnitName,
        value: String(item.packTypeUnitId),
      }));

      setPackTypeUnitOptions(options);
    } catch (error) {
      console.error("Error fetching pack type units:", error);
    }
  };

  return (
    <>
      <PopupModal
        isOpen={showSuccessModal}
        title={
          modalType === "update"
            ? "Product Updated Successfully!"
            : "Product Saved Successfully!"
        }
        description={
          modalType === "update"
            ? "Your product has been updated and is now live on the platform"
            : "Your product has been saved and is now live on the platform"
        }
        primaryActionText="View Product"
        secondaryActionText={
          modalType === "update" ? "Continue Editing" : "Continue Adding"
        }
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={
          modalType === "update" ? handleContinueEditing : handleContinueAdding
        }
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccessModal(false)}
      />

      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => {
            setShowAdditionalDiscount(false);
            setEditTab(null);
            setEditIndex(null);
          }}
          width="w-[600px]"
        >
          <AdditionalDiscountType
            onClose={() => {
              setShowAdditionalDiscount(false);
              setEditTab(null);
              setEditIndex(null);
            }}
            categoryId={categoryId}
            initialData={form.additionalDiscount}
            baseDiscountPercentage={Number(form.discountPercentage) || 0}
            baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
            onSaveAdditionalDiscount={(data) => {
              console.log("FROM MODAL", data);

              setForm((prev) => ({
                ...prev,
                additionalDiscount: data,
              }));
            }}
            editTab={editTab}
            editIndex={editIndex}
          />
        </CommonModal>
      )}
      <form className="w-full" autoComplete="off">
        {/* <form className="w-full"> */}
        <div className="relative border border-neutral-200 rounded-xl p-6  bg-white">
          <div className="text-h4 font-semibold font-heading">
            Product Details
          </div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                Therapeutic Category
                <span className="text-warning-500 ml-1">*</span>
              </label>
              <Dropdown
                options={therapeuticCategories}
                value={form.therapeuticCategory || ""}
                onChange={(value, label) => {
                  handleTherapeuticCategoriesChange({
                    value,
                    label,
                  });
                }}
                placeholder="Select category"
                isLoading={loadingTherapeuticCategories}
                isDisabled={isEditMode}
                error={errors.therapeuticCategory}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                Therapeutic Subcategory
                <span className="text-warning-500 ml-1">*</span>
              </label>

              <Dropdown
                options={subcategoryOptions}
                value={form.therapeuticSubcategory || ""}
                onChange={(value, label) => {
                  handleSubcategoryChange({
                    value,
                    label,
                  });
                }}
                placeholder="Select subcategory"
                isLoading={loadingSubcategories}
                isDisabled={isEditMode}
                error={errors.therapeuticSubcategory}
              />
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

            <div className="flex flex-col ">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                Dosage Form (Tablet, Syrup)
                <span className="text-warning-500 ml-1">*</span>
              </label>
              <Dropdown
                options={dosageOptions.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                value={String(form.dosageId || "")}
                onChange={(value, label) => {
                  handleDosageChange({
                    value,
                    label,
                  });
                }}
                placeholder="Select dosage"
                isLoading={loadingDosage}
                isDisabled={isEditMode}
                error={errors.dosageId}
              />
            </div>

            <div className="col-span-2 border border-[#C0C1BE] rounded-lg p-4 space-y-6">
              {form.molecules.map((molecule, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_0.87fr_52px] gap-6 items-start"
              >
                {/* Molecule */}
                <div className="w-full min-w-0">
                  <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                    Molecule
                    <span className="text-warning-500 ml-1">*</span>
                  </label>

                  <Dropdown
                    options={moleculeOptions.map((option) => ({
                      value: String(option.value.moleculeId),
                      label: option.label,
                    }))}
                    value={molecule.moleculeId || ""}
                    onChange={(value) => {
                      const selectedOption = moleculeOptions.find(
                        (o) => String(o.value.moleculeId) === value,
                      );

                      handleMoleculeSelect(index, selectedOption || null);
                    }}
                    placeholder="Select molecule"
                    isLoading={loadingMolecules}
                    isDisabled={isEditMode}
                    error={errors[`molecules.${index}.moleculeId`]}
                    className="w-full"
                  />
                </div>

                {/* Strength */}
                <div className="w-full min-w-0">
                  <Input
                    label="Molecule Strength"
                    name="strength"
                    placeholder={
                      molecule.moleculeStrengthFormat ||
                      strengthFormats.join(", ") ||
                      "Enter strength"
                    }
                    value={molecule.strength || ""}
                    onChange={(e) =>
                      handleStrengthChange(index, e.target.value)
                    }
                    readOnly={isEditMode}
                    required
                  />

                  {errors[`molecules.${index}.strength`] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[`molecules.${index}.strength`]}
                    </p>
                  )}
                </div>

                {/* Remove button / spacer */}
                <div className="flex items-end h-full">
                  {!isEditMode && form.molecules.length > 1 ? (
                    <button
                      onClick={() => removeMolecule(index)}
                      className="border-2 border-[#FF3B3B] w-13 h-12 rounded-lg flex items-center justify-center"
                    >
                      <img
                        src="/icons/RedMinusIcon.svg"
                        alt="remove"
                        className="w-5 h-5 object-contain"
                      />
                    </button>
                  ) : (
                    <div className="w-13 h-12" />
                  )}
                </div>
              </div>
              ))}

              {!isEditMode && (
                <button
                  onClick={addMolecule}
                  className="w-40 h-12 border-2 border-secondary-700 text-secondary-700 text-label-l4 font-semibold rounded-lg flex items-center justify-center gap-2.5"
                >
                  {" "}
                  <img
                    src="/icons/PlusIcon.svg"
                    alt="drug"
                    className="w-5 h-5 rounded-md object-cover"
                  />{" "}
                  Add Molecule{" "}
                </button>
              )}
            </div>

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

            <div className="flex flex-col ">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                Storage Condition
                <span className="text-warning-500 ml-1">*</span>
              </label>

              <CheckboxDropdown
                options={storageConditionOptions.map((option: any) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                selectedValues={
                  form.storageConditionIds?.map((id) => String(id)) || []
                }
                onChange={(selectedValues) => {
                  setForm((prev) => ({
                    ...prev,
                    storageConditionIds: selectedValues.map((id) => Number(id)),
                  }));
                }}
                placeholder="Select storage conditions"
                error={errors.storageConditionIds}
                showSelectAll={true}
                disabled={isEditMode}
              />
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

            <Input
              label="GST %"
              name="gstPercentage"
              id="gstPercentage"
              placeholder="e.g. 12"
              value={form.gstPercentage}
              onChange={handleChange}
              error={errors.gstPercentage}
              required
            />

            <Input
              label="HSN Code"
              name="hsnCode"
              id="hsnCode"
              placeholder="e.g. 3004"
              value={form.hsnCode}
              onChange={handleChange}
              error={errors.hsnCode}
              required
            />

            <div>
              <label className="block text-label-l4 font-medium text-pneutral-900 mb-1 font-heading">
                Warnings & Precautions
                <span className="text-warning-500 ml-1">*</span>
              </label>
              <textarea
                name="warningsPrecautions"
                id="warningsPrecautions"
                placeholder="Enter contraindications, side effects, storage conditions"
                value={form.warningsPrecautions}
                onChange={handleChange}
                maxLength={1000}
                rows={4}
                className={`w-full h-36 rounded-lg p-3 resize-none overflow-y-auto border ${
                  errors.warningsPrecautions
                    ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                    : "border-pneutral-300 focus:border-2 focus:border-[#C4AAFD]"
                } focus:outline-none focus:ring-0`}
              />
              {errors.warningsPrecautions && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.warningsPrecautions}
                </p>
              )}
            </div>

            <div>
              <label className="block text-label-l4 font-medium text-pneutral-900 mb-1 font-heading">
                Product Description
                <span className="text-warning-500 ml-1">*</span>
              </label>
              <textarea
                name="productDescription"
                id="productDescription"
                placeholder="Brief product overview, indications, pack details"
                value={form.productDescription}
                onChange={handleChange}
                maxLength={1000}
                rows={4}
                className={`w-full h-36 rounded-lg p-3 resize-none overflow-y-auto border ${
                  errors.productDescription
                    ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                    : "border-pneutral-300 focus:border-2 focus:border-[#C4AAFD]"
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

      

        <ProductImageUpload
          title="Product Photos"
          required
          images={images}
          setImages={setImages}
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          error={errors.images}
          setErrors={setErrors}
          isReadOnly={isReadOnly}
          mode={mode}
        />

        <div className="flex justify-between mt-6 col-span-2">
          <div className="space-x-6 flex">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-35.25 h-12 border-2 border-warning-500 rounded-lg text-label-l4 font-medium text-warning-500 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              className="w-35.25 h-12 bg-secondary-700 text-pneutral-50 text-label-l4 font-medium rounded-lg flex items-center justify-center gap-2.5"
            >
              <img
                src="/icons/SaveDraftIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover"
              />
              Save Draft
            </button>
          </div>
          <div>
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-primary-800 text-pneutral-50 text-label-l4 font-medium rounded-lg p-3 w-35.25 h-12 cursor-pointer"
              >
                Update
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-primary-800 text-pneutral-50 text-label-l4 font-medium rounded-lg p-3 w-35.25 h-12 cursor-pointer"
              >
                Submit
              </button>
            )}
          </div>
        </div>

      </form>
    </>
  );
};
