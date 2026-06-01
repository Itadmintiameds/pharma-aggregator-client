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
import AddDiscNew from "./AdditionalDiscountNew";
import AdditionalDiscountType from "./AdditionalDiscountType";
import {
  getTherapeuticCategory,
  getTherapeuticSubcategory,
} from "@/src/services/product/TherapeuticCategoryService";
import { getSupplementDosageForms } from "@/src/services/product/SupplementService";
import { useRouter } from "next/navigation";
import { validateBatchNumber } from "@/src/services/product/Pricing";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";

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

  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [productAttributeId, setProductAttributeId] = useState<string | null>(
    null,
  );
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] =
    useState(false);

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
    const validation = drugProductSchema.safeParse({
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

    const batchValidation = await validateBatchNumber(
      form.batchLotNumber,
      Number(form.categoryId),
    );

    if (batchValidation.exists) {
      setErrors((prev) => ({
        ...prev,
        batchLotNumber: "Batch number already exists",
      }));

      return;
    }

    const mrp = Number(form.mrp) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;

    if (sellingPrice >= mrp) {
      setErrors((prev) => ({
        ...prev,
        sellingPrice: "Selling Price must be less than MRP",
      }));

      return;
    }

    // const strengthErrors: Record<string, string> = {};

    // form.molecules.forEach((molecule, index) => {
    //   const error = validateStrengthFormat(molecule.strength);

    //   if (error) {
    //     strengthErrors[`molecules.${index}.strength`] = error;
    //   }
    // });

    // if (Object.keys(strengthErrors).length > 0) {
    //   setErrors((prev) => ({
    //     ...prev,
    //     ...strengthErrors,
    //   }));

    //   return;
    // }

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
    router.push("/seller_7a3b9f2c/products");
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
    if (mode === "edit" && productId && moleculeOptions.length > 0) {
      fetchProductByIdAndFillForm(productId);
    }
  }, [mode, productId, moleculeOptions.length]);

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

      const selectedDosage = fetchedDosageOptions.find(
        (option: any) => option.label?.trim().toLowerCase() === dosageForm,
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
        dosageId: selectedDosage ? Number(selectedDosage.value) : "",
        strength: String(attributeDrug.strength ?? ""),
        storageConditionIds: attributeDrug.storageConditionIds || [],

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

        // productImages: images.map((img) => ({
        //   productImage: img.name,
        // })),
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

  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "52px",
      height: "auto",
      borderRadius: "8px",
      borderWidth: state.isFocused ? "2px" : "1px",

      // ✅ Border colors
      borderColor: errors[errorKey]
        ? "#FF3B3B" // error
        : state.isFocused
          ? "#C4AAFD" // focus / typing
          : "#C0C1BE", // default

      boxShadow: "none",
      cursor: "pointer",

      alignItems:
        state.hasValue && state.selectProps.isMulti ? "flex-start" : "center",

      // ✅ Hover colors
      "&:hover": {
        borderColor: errors[errorKey]
          ? "#FF3B3B"
          : state.isFocused
            ? "#C4AAFD"
            : "#C0C1BE",
      },
    }),

    valueContainer: (base: any) => ({
      ...base,
      padding: "8px 16px",
      flexWrap: "wrap",
      overflow: "visible",
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "52px",
    }),

    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#C4AAFD" : "#737373",
      cursor: "pointer",
      "&:hover": {
        color: "#C4AAFD",
      },
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

      "&:active": {
        backgroundColor: "#4B0082",
        color: "white",
      },
    }),

    placeholder: (base: any) => ({
      ...base,
      color: "#A3A3A3",
    }),

    singleValue: (base: any) => ({
      ...base,
      color: "#1E1E1E",
    }),

    multiValue: (base: any) => ({
      ...base,
      margin: "2px",
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

  const handleMonthSelect = (
    field: "manufacturingDate" | "expiryDate",
    month: number,
    year: number,
  ) => {
    const selectedDate = new Date(year, month, 1);

    if (field === "manufacturingDate") {
      const today = new Date();

      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (selectedDate > currentMonth) {
        setErrors((prev) => ({
          ...prev,
          manufacturingDate: "Manufacturing date cannot be in the future month",
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        manufacturingDate: "",
        expiryDate: "Expiry must be within 5 years from Manufacturing Date",
      }));

      setForm((prev) => ({
        ...prev,
        manufacturingDate: selectedDate,
        expiryDate: null,
        shelfLifeMonths: "",
      }));

      setShowManufacturingMonthPicker(false);
      return;
    }

    if (field === "expiryDate") {
      setForm((prev) => {
        const updatedForm = {
          ...prev,
          expiryDate: selectedDate,
        };

        let expiryError = "";

        if (updatedForm.manufacturingDate) {
          const mfg = new Date(updatedForm.manufacturingDate);
          const today = new Date();

          // minimum = current month + 3 months
          const minDate = new Date(
            today.getFullYear(),
            today.getMonth() + 3,
            1,
          );

          // maximum = manufacturing + 5 years
          const maxDate = new Date(mfg.getFullYear() + 5, mfg.getMonth(), 1);

          // shelf life calculation
          const totalMonths =
            (selectedDate.getFullYear() - mfg.getFullYear()) * 12 +
            (selectedDate.getMonth() - mfg.getMonth()) +
            1;

          const monthsUntilExpiry =
            (selectedDate.getFullYear() - today.getFullYear()) * 12 +
            (selectedDate.getMonth() - today.getMonth()) +
            1;

          updatedForm.shelfLifeMonths =
            totalMonths >= 0 ? totalMonths.toString() : "";

          if (monthsUntilExpiry > 0 && monthsUntilExpiry <= 3) {
            expiryError =
              monthsUntilExpiry === 1
                ? "This product expires within 1 month, but it can still be added."
                : `This product expires within ${monthsUntilExpiry} months, but it can still be added.`;
          } else if (selectedDate > maxDate) {
            expiryError =
              "Expiry cannot be more than 5 years from Manufacturing Date";
          }
        }

        setErrors((prevErrors) => ({
          ...prevErrors,
          expiryDate: expiryError,
        }));

        return updatedForm;
      });

      setShowExpiryMonthPicker(false);
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
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]"
        >
          <AdditionalDiscountType
            onClose={() => setShowAdditionalDiscount(false)}
            categoryId={categoryId}
            initialData={form.additionalDiscount}
            baseDiscountPercentage={Number(form.discountPercentage) || 0}
            baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
            onSaveAdditionalDiscount={(data) =>
              setForm((prev) => ({
                ...prev,
                additionalDiscount: data,
              }))
            }
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

            {form.molecules.map((molecule, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_0.87fr_52px] gap-6 col-span-2 items-start"
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
                    placeholder={strengthFormats.join(", ") || "Enter strength"}
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
                  {!isEditMode ? (
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

        {/* Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6 bg-white">
          <div className="text-h4 font-semibold font-heading">
            Packaging & Order Details
          </div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col ">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                Pack Type
                <span className="text-warning-500 ml-1">*</span>
              </label>

              <Dropdown
                options={packTypeOptions.map((option: any) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                value={form.packId || ""}
                onChange={(value, label) =>
                  setForm((prev) => ({
                    ...prev,
                    packId: value,
                    packType: label,
                  }))
                }
                placeholder="Select Pack Type"
                isDisabled={isEditMode}
                // isDisabled={isEditMode || !form.dosageId}
                error={errors.packId}
              />
            </div>

            <Input
              type="number"
              label="Number of Units per Pack Type"
              name="unitPerPack"
              id="unitPerPack"
              placeholder=""
              value={form.unitPerPack}
              onChange={handleChange}
              readOnly={isEditMode}
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
              readOnly={isEditMode}
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
              readOnly={isEditMode}
              required
            />

            <div className="text-h6 font-normal col-span-2 mt-3 font-heading">
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

            <div className="text-h6 font-normal col-span-2 mt-3 font-heading">
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

            <div className="relative">
              <Input
                label="Manufacturing Month"
                type="text"
                name="manufacturingDate"
                id="manufacturingDate"
                required
                readOnly={isEditMode}
                value={
                  form.manufacturingDate instanceof Date &&
                  !isNaN(form.manufacturingDate.getTime())
                    ? `${String(form.manufacturingDate.getMonth() + 1).padStart(
                        2,
                        "0",
                      )}/${form.manufacturingDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}} // prevents React warning
                onClick={() => {
                  if (!isEditMode) {
                    setShowManufacturingMonthPicker(true);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()} // block typing
                onPaste={(e) => e.preventDefault()}
                error={errors.manufacturingDate}
              />

              {showManufacturingMonthPicker && !isEditMode && (
                <MonthPicker
                  selectedMonth={
                    form.manufacturingDate
                      ? form.manufacturingDate.getMonth()
                      : new Date().getMonth()
                  }
                  selectedYear={
                    form.manufacturingDate
                      ? form.manufacturingDate.getFullYear()
                      : new Date().getFullYear()
                  }
                  maxDate={new Date()}
                  onSelect={(month, year) =>
                    handleMonthSelect("manufacturingDate", month, year)
                  }
                  onClose={() => setShowManufacturingMonthPicker(false)}
                />
              )}
            </div>

            <div className="relative">
              <Input
                label="Expiry Month"
                name="expiryDate"
                type="text"
                required
                readOnly={isEditMode}
                value={
                  form.expiryDate instanceof Date &&
                  !isNaN(form.expiryDate.getTime())
                    ? `${String(form.expiryDate.getMonth() + 1).padStart(
                        2,
                        "0",
                      )}/${form.expiryDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}} // prevents React warning
                onClick={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(true);
                  }
                }}
                onFocus={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(true);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                error={errors.expiryDate}
              />

              {showExpiryMonthPicker && !isEditMode && (
                <MonthPicker
                  selectedMonth={
                    form.expiryDate
                      ? form.expiryDate.getMonth()
                      : new Date().getMonth()
                  }
                  selectedYear={
                    form.expiryDate
                      ? form.expiryDate.getFullYear()
                      : new Date().getFullYear()
                  }
                  minDate={
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                  maxDate={
                    form.manufacturingDate
                      ? new Date(
                          form.manufacturingDate.getFullYear() + 5,
                          form.manufacturingDate.getMonth(),
                          1,
                        )
                      : undefined
                  }
                  onSelect={(month, year) =>
                    handleMonthSelect("expiryDate", month, year)
                  }
                  onClose={() => setShowExpiryMonthPicker(false)}
                />
              )}
            </div>

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
              readOnly
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

            <div className="text-h6 font-normal col-span-2 mt-3 font-heading">
              Pricing
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="MRP"
              name="mrp"
              id="mrp"
              placeholder=""
              value={form.mrp}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "0" && form.mrp === "") {
                  e.preventDefault();
                }
              }}
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
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowAdditionalDiscount(true)}
                  className="w-59.25 h-14 px-6 border-[2.5px] border-secondary-700 text-secondary-700 text-label-l4 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img
                    src="/icons/PlusIcon.svg"
                    alt="drug"
                    className="w-6 h-6"
                  />
                  Add Special Offers
                </button>
              </div>
            </div>
            <div className="text-h6 font-normal col-span-2 mt-3 font-heading">
              TAX & BILLING
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <div className="flex flex-col ">
              <label className="text-label-l4 font-medium text-pneutral-900 font-heading">
                GST %<span className="text-warning-500 ml-1">*</span>
              </label>
              <Dropdown
                options={gstOptions.map((option: any) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                value={String(form.gstPercentage || "")}
                onChange={(value, label) =>
                  setForm((prev) => ({
                    ...prev,
                    gstPercentage: value,
                  }))
                }
                placeholder="Select GST %"
                isDisabled={isEditMode}
                error={errors.gstPercentage}
              />
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
              onClick={() => router.back()}
              className="w-35.25 h-12 border-2 border-warning-500 rounded-lg text-label-l4 font-medium text-warning-500 cursor-pointer"
            >
              Cancel
            </button>

            <button className="w-35.25 h-12 bg-secondary-700 text-pneutral-50 text-label-l4 font-medium rounded-lg flex items-center justify-center gap-2.5">
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
        {/* </div> */}
      </form>
    </>
  );
};
