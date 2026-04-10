import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import { getAllMolecules } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  getDosage,
  getMoleculeStrengthByDosage,
  getPackTypesByDosageId,
  getTherapeuticCategory,
  getTherapeuticSubcategory,
  uploadProductImages,
} from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import CommonModal from "../commonComponent/CommonModal";
import AdditionalDiscount from "./AdditionalDiscount";

interface SelectOption {
  value: string;
  label: string;
}

interface DrugFormProps {
  categoryId: number;
}

export const DrugForm: React.FC<DrugFormProps> = ({ categoryId }) => {
  type FormState = {
    productId: string;
    categoryId: string;
    productName: string;
    productDescription: string;
    productMarketingUrl: string;
    warningsPrecautions: string;

    therapeuticCategoryId: string;
    therapeuticCategory: string;
    therapeuticSubcategoryId: string;
    therapeuticSubcategory: string;
    manufacturerName: string;

    dosageId: number | "";
    strength: string;

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
    storageCondition: string;
    stockQuantity: string;
    sellingPrice: string;
    mrp: string;
    gstPercentage: string;
    discountPercentage: string;
    finalPrice: string;
    hsnCode: string;

    // ✅ IMPORTANT FIX
    additionalDiscount: AdditionalDiscountData[];
  };

  const [form, setForm] = useState<FormState>({
    productId: "",
    categoryId: "",
    productName: "",
    productDescription: "",
    productMarketingUrl: "",
    warningsPrecautions: "",

    therapeuticCategoryId: "",
    therapeuticCategory: "",
    therapeuticSubcategoryId: "",
    therapeuticSubcategory: "",
    manufacturerName: "",

    dosageId: "" as number | "",
    strength: "",

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
    storageCondition: "",
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    gstPercentage: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
    additionalDiscount: [],
  });

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
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

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  // ) => {
  //   const { name, value } = e.target;

  //   setForm((prev) => {
  //     const updatedForm = {
  //       ...prev,
  //       [name]: value,
  //     };

  //     const unitPerPack = Number(updatedForm.unitPerPack) || 0;
  //     const numberOfPacks = Number(updatedForm.numberOfPacks) || 0;

  //     updatedForm.packSize = String(unitPerPack * numberOfPacks);

  //     return updatedForm;
  //   });
  // };

  const getMinExpiryDate = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    return today.toISOString().split("T")[0];
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

        if (updatedForm.discountPercentage !== "") {
          if (isNaN(discount) || discount < 0 || discount > 100) {
            newErrors.discountPercentage = "Discount must be between 0 and 100";
          } else {
            delete newErrors.discountPercentage;
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

        if (expiry) {
          const minDate = new Date();
          minDate.setMonth(minDate.getMonth() + 3);

          // normalize
          const normalizedExpiry = new Date(expiry);
          normalizedExpiry.setHours(0, 0, 0, 0);

          const normalizedMin = new Date(minDate);
          normalizedMin.setHours(0, 0, 0, 0);

          if (normalizedExpiry < normalizedMin) {
            newErrors.expiryDate =
              "Expiry date must be at least 3 months from today";
          } else {
            delete newErrors.expiryDate;
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
    alert("Helllooooo");
    const validation = drugProductSchema.safeParse(form);

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
    alert("Helllooooo1111111");
    try {
      const payload = {
        productName: form.productName,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
        warningsPrecautions: form.warningsPrecautions,

        manufacturerName: form.manufacturerName, // ✅ MOVED TO ROOT

        categoryId: Number(form.categoryId), // ✅ FIX

        packagingDetails: {
          packId: Number(form.packId),
          packType: form.packType,
          unitPerPack: Number(form.unitPerPack), // ✅ STRING
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },

        pricingDetails: [
          {
            batchLotNumber: form.batchLotNumber,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            storageCondition: form.storageCondition,
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
            sellingPrice: Number(form.sellingPrice),
            mrp: Number(form.mrp),
            discountPercentage: Number(form.discountPercentage),
            gstPercentage: Number(form.gstPercentage),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
            shelfLifeMonths: 24, // optional

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
              dosageOptions.find((d) => d.value === form.dosageId)?.label || "", // ✅ FIX

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

      // console.log("Product Response:", productResponse);

      const productId = productResponse.data.productId;

      if (images.length > 0) {
        await uploadProductImages(productId, images);
      }

      if (!productId) {
        throw new Error("Product ID not returned from backend");
      }

      alert("✅ Product + Images uploaded successfully!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Submit Error:", err);
      alert("❌ Failed to create product");
    }
  };

  // useEffect(() => {
  //   if ((mode === "edit" || mode === "delete") && selectedProductId) {
  //     fetchProductByIdAndFillForm(selectedProductId);
  //   }
  // }, [mode, selectedProductId]);

  // const fetchProductByIdAndFillForm = async (id: string) => {
  //   try {
  //     const data = await getDrugProductById(id);
  //     if (!data) throw new Error("Product not found");
  //     const pricing = data.pricingDetails?.[0] || {};
  //     const packaging = data.packagingDetails || {};
  //     setForm({
  //       productId: data.productId || "",
  //       // productCategoryId: String(data.productCategoryId || ""),
  //       productName: data.productName || "",
  //       therapeuticCategory: data.productCategoryId || "",
  //       therapeuticSubcategory: data.therapeuticSubcategory || "",
  //       dosageId: data.dosageId || "",
  //       strength: String(data.strength ?? ""),
  //       warningsPrecautions: data.warningsPrecautions || "",
  //       productDescription: data.productDescription || "",
  //       productMarketingUrl: data.productMarketingUrl || "",
  //       molecules:
  //         data.molecules?.length > 0
  //           ? data.molecules.map((m: any) => ({
  //               moleculeId: m.moleculeId ?? null,
  //               moleculeName: m.moleculeName ?? "",
  //               mechanismOfAction: m.mechanismOfAction ?? "",
  //               primaryUse: m.primaryUse ?? "",
  //             }))
  //           : [
  //               {
  //                 moleculeId: null,
  //                 moleculeName: "",
  //                 mechanismOfAction: "",
  //                 primaryUse: "",
  //               },
  //             ],
  //       packagingUnit: packaging.packagingUnit || "",
  //       numberOfUnits: String(packaging.numberOfUnits ?? ""),
  //       packSize: String(packaging.packSize ?? ""),
  //       minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
  //       maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
  //       packagingId: packaging.packagingId || "",
  //       pricingId: pricing.pricingId || "",
  //       batchLotNumber: pricing.batchLotNumber || "",
  //       manufacturerName: pricing.manufacturerName || "",
  //       manufacturingDate: pricing.manufacturingDate
  //         ? new Date(pricing.manufacturingDate)
  //         : null,
  //       expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
  //       storageCondition: pricing.storageCondition || "",
  //       stockQuantity: String(pricing.stockQuantity ?? ""),
  //       pricePerUnit: String(pricing.pricePerUnit ?? ""),
  //       mrp: String(pricing.mrp ?? ""),
  //       // createdDate: form.createdDate,
  //       gstPercentage: String(pricing.gstPercentage ?? ""),
  //       discountPercentage: String(pricing.discountPercentage ?? ""),
  //       minimumPurchaseQuantity: String(pricing.minimumPurchaseQuantity ?? ""),
  //       additionalDiscount: String(pricing.additionalDiscount ?? ""),
  //       finalPrice: String(pricing.finalPrice ?? ""),
  //       hsnCode: String(pricing.hsnCode ?? ""),
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to load product");
  //   }
  // };

  const handleDelete = async () => {
    if (!form.productId) return;
    const confirmed = confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    try {
      await drugProductDelete(form.productId);
      alert("Product deleted successfully");
      setMode("create");
      setSelectedProductId(null);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  // const handleUpdate = async () => {
  //   try {
  //     const moleculeIds = form.molecules
  //       .map((m) => m.moleculeId)
  //       .filter((id): id is number => id !== null);
  //     const payload = {
  //       productId: form.productId,
  //       // productCategoryId: form.productCategoryId,
  //       productName: form.productName,
  //       therapeuticCategory: form.therapeuticCategory,
  //       therapeuticSubcategory: form.therapeuticSubcategory,
  //       dosageId: form.dosageId,
  //       strength: Number(form.strength),
  //       warningsPrecautions: form.warningsPrecautions,
  //       productDescription: form.productDescription,
  //       productMarketingUrl: form.productMarketingUrl,
  //       packagingDetails: {
  //         packagingUnit: form.packagingUnit,
  //         numberOfUnits: Number(form.numberOfUnits),
  //         packSize: Number(form.packSize),
  //         minimumOrderQuantity: Number(form.minimumOrderQuantity),
  //         maximumOrderQuantity: Number(form.maximumOrderQuantity),
  //       },
  //       pricingDetails: [
  //         {
  //           pricingId: form.pricingId || undefined,
  //           batchLotNumber: form.batchLotNumber,
  //           manufacturerName: form.manufacturerName,
  //           manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
  //           expiryDate: toLocalDateTimeString(form.expiryDate),
  //           storageCondition: form.storageCondition,
  //           stockQuantity: Number(form.stockQuantity),
  //           pricePerUnit: Number(form.pricePerUnit),
  //           mrp: Number(form.mrp),
  //           discountPercentage: Number(form.discountPercentage),
  //           gstPercentage: Number(form.gstPercentage),
  //           additionalDiscount: Number(form.additionalDiscount),
  //           minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
  //           finalPrice: Number(form.finalPrice),
  //           hsnCode: Number(form.hsnCode),
  //         },
  //       ],
  //       moleculeIds,
  //     };
  //     await editDrugProduct(form.productId, payload as any);
  //     alert("Product updated successfully");
  //     setMode("create");
  //     setSelectedProductId(null);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Update failed");
  //   }
  // };

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
      height: "56px",
      minHeight: "56px",
      borderRadius: "16px",
      borderColor: errors[errorKey]
        ? "#FF3B3B"
        : state.isFocused
          ? "#4B0082"
          : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 16px",
      cursor: "pointer",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px",
      cursor: "pointer",
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

  // const handleDosageChange = async (selected: any) => {
  //   const dosageId = selected?.value;

  //   setForm((prev) => ({
  //     ...prev,
  //     dosageId,
  //   }));

  //   try {
  //     const data = await getMoleculeStrengthByDosage(dosageId);

  //     // extract only strength text
  //     const strengths = data.map((item: any) => item.moleculeStrengthFormat);

  //     setStrengthFormats(strengths);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleDosageChange = async (selected: any) => {
    const dosageId = selected?.value;

    setForm((prev) => ({
      ...prev,
      dosageId,

      // ✅ FIXED structure
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
        console.log("PackType API:", res);

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

  return (
    <>
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
                isDisabled={mode === "delete"}
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
                isDisabled={!form.therapeuticCategory || mode === "delete"}
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
              disabled={mode === "delete"}
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
                isDisabled={mode === "delete"}
                theme={selectTheme}
                styles={selectStyles("dosageId")}
              />

              {errors.dosageId && (
                <p className="text-red-500 text-sm mt-1">{errors.dosageId}</p>
              )}
            </div>

            {form.molecules.map((molecule, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 col-span-2">
                <div className="flex flex-col gap-1">
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
                    isDisabled={mode === "delete"}
                    theme={selectTheme}
                    styles={selectStyles("molecule")}
                  />
                  {errors.molecules && typeof errors.molecules === "string" && (
                    <p className="text-red-500 text-sm">{errors.molecules}</p>
                  )}
                </div>

                <Input
                  label="Molecule Strength"
                  name="strength"
                  placeholder={strengthFormats.join(", ") || "Enter strength"}
                  value={molecule.strength || ""}
                  onChange={(e) => handleStrengthChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
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

            <Input
              label="Manufacturer Name"
              name="manufacturerName"
              id="manufacturerName"
              placeholder=""
              value={form.manufacturerName}
              onChange={handleChange}
              disabled={mode === "delete"}
              error={errors.manufacturerName}
              required
            />

            <div className="col-span-2">
              <Input
                label="Marketing URL"
                name="productMarketingUrl"
                id="productMarketingUrl"
                placeholder="https://"
                value={form.productMarketingUrl}
                onChange={handleChange}
                disabled={mode === "delete"}
                // error={errors.productMarketingUrl}
                // required
              />
            </div>

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
                disabled={mode === "delete"}
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
                disabled={mode === "delete"}
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
                isDisabled={!form.dosageId || mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
              error={errors.batchLotNumber}
              required
            />

            <Input
              label="Manufacturing Date"
              type="date"
              name="manufacturingDate"
              id="manufacturingDate"
              placeholder=""
              onChange={(e) =>
                setForm({
                  ...form,
                  manufacturingDate: new Date(e.target.value),
                })
              }
              value={
                form.manufacturingDate
                  ? form.manufacturingDate.toISOString().split("T")[0]
                  : ""
              }
              disabled={mode === "delete"}
              error={errors.manufacturingDate}
              required
            />

            <Input
              label="Expiry Date"
              type="date"
              name="expiryDate"
              value={
                form.expiryDate
                  ? form.expiryDate.toISOString().split("T")[0]
                  : ""
              }
              onChange={handleChange} // ✅ FIX
              min={getMinExpiryDate()}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const input = e.currentTarget;
                const selectedDate = new Date(input.value);

                const minDate = new Date();
                minDate.setMonth(minDate.getMonth() + 3);
                minDate.setHours(0, 0, 0, 0);

                if (selectedDate < minDate) {
                  input.value = ""; // ❌ clear invalid input
                }
              }}
              disabled={mode === "delete"}
              error={errors.expiryDate}
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
              label="Storage Condition"
              name="storageCondition"
              id="storageCondition"
              placeholder=""
              value={form.storageCondition}
              onChange={handleChange}
              disabled={mode === "delete"}
              error={errors.storageCondition}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
              disabled={mode === "delete"}
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
                  onInput={(e: any) => {
                    if (e.target.value > 100) e.target.value = 100;
                    if (e.target.value < 0) e.target.value = 0;
                  }}
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

            {/* <Input
              label="GST %"
              name="gstPercentage"
              id="gstPercentage"
              placeholder=""
              value={form.gstPercentage}
              onChange={handleChange}
              disabled={mode === "delete"}
              error={errors.gstPercentage}
              required
            /> */}

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                GST %
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

              <Select
                options={gstOptions}
                value={
                  gstOptions.find(
                    (o: any) => String(o.value) === String(form.gstPercentage),
                  ) || null
                }
                onChange={(selected: any) =>
                  setForm((prev) => ({
                    ...prev,
                    gstPercentage: selected?.value || "",
                  }))
                }
                placeholder="Select GST %"
                isDisabled={mode === "delete"}
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
              disabled={mode === "delete"}
              error={errors.hsnCode}
              required
            />

            {/* <div className="col-span-2">
              <Input
                label="Final Price (after discounts):"
                name="finalPrice"
                id="finalPrice"
                value={form.finalPrice}
                disabled
                labelClassName="text-[#3C0368]" // ✅ THIS WORKS
                required
              />
            </div> */}
          </div>
        </div>

        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-[#364153] font-normal text-sm">
            Product Photos{" "}
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </div>

          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setImages(Array.from(e.target.files));
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

          {images.length > 0 && (
            <div className="mt-2 text-green-600 text-sm">
              ✅ {images.length} image(s) added successfully
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-md border"
                  />

                  {/* Remove button */}
                  <button
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== index))
                    }
                    className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {mode === "delete" ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
              >
                Delete
              </button>
            ) : mode === "edit" ? (
              <button
                type="button"
                // onClick={handleUpdate}
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
