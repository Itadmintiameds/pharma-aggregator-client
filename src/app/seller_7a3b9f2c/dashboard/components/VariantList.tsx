"use client";

import React, { useState } from "react";
import { Pencil, Trash2, X, Plus } from "lucide-react";

interface DiscountSlab {
  minQt: number;
  maxQt: number;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

interface Variant {
  id: string;
  packSize: string;
  stock: string;
  sellingPrice: string;
  mrp: string;
  moq: string;
  batch: string;
  expiryDate: string;
  // Packaging & Order
  packType?: string;
  unitsPerPack?: string;
  numberOfPacks?: string;
  minOrderQty?: string;
  maxOrderQty?: string;
  // Batch details
  manufacturingDate?: string;
  stockQuantity?: string;
  dateOfEntry?: string;
  // Pricing
  discountPercent?: string;
  finalPrice?: string;
  // Tax
  gst?: string;
  hsnCode?: string;
  // Discount slabs
  discountSlabs?: DiscountSlab[];
  [key: string]: unknown;
}

interface VariantListProps {
  variants: Variant[];
  onAdd: (variant: Omit<Variant, 'id'>) => void;
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-neutral-700/50">
    <span className="text-sm text-neutral-400">{label}</span>
    <span className="text-sm text-white font-medium">{value || "—"}</span>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="pt-6 pb-3">
    <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">{title}</p>
    <div className="border-b border-neutral-700" />
  </div>
);

// Variant Form Modal Component
const VariantFormModal = ({ 
  variant, 
  onSave, 
  onClose 
}: { 
  variant: Variant | null; 
  onSave: (variantData: Omit<Variant, 'id'>) => void; 
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    packSize: variant?.packSize || "",
    stock: variant?.stock || "",
    sellingPrice: variant?.sellingPrice || "",
    mrp: variant?.mrp || "",
    moq: variant?.moq || "",
    batch: variant?.batch || "",
    expiryDate: variant?.expiryDate || "",
    packType: variant?.packType || "",
    unitsPerPack: variant?.unitsPerPack || "",
    numberOfPacks: variant?.numberOfPacks || "",
    minOrderQty: variant?.minOrderQty || "",
    maxOrderQty: variant?.maxOrderQty || "",
    manufacturingDate: variant?.manufacturingDate || "",
    stockQuantity: variant?.stockQuantity || "",
    dateOfEntry: variant?.dateOfEntry || new Date().toISOString().split('T')[0],
    discountPercent: variant?.discountPercent || "",
    finalPrice: variant?.finalPrice || "",
    gst: variant?.gst || "",
    hsnCode: variant?.hsnCode || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.packSize.trim()) newErrors.packSize = "Pack size is required";
    if (!formData.stock.trim()) newErrors.stock = "Stock is required";
    if (!formData.sellingPrice.trim()) newErrors.sellingPrice = "Selling price is required";
    if (!formData.mrp.trim()) newErrors.mrp = "MRP is required";
    if (!formData.moq.trim()) newErrors.moq = "MOQ is required";
    if (!formData.batch.trim()) newErrors.batch = "Batch number is required";
    if (!formData.expiryDate.trim()) newErrors.expiryDate = "Expiry date is required";
    
    // Validate numeric fields
    if (formData.sellingPrice && isNaN(Number(formData.sellingPrice))) {
      newErrors.sellingPrice = "Selling price must be a number";
    }
    if (formData.mrp && isNaN(Number(formData.mrp))) {
      newErrors.mrp = "MRP must be a number";
    }
    if (formData.moq && isNaN(Number(formData.moq))) {
      newErrors.moq = "MOQ must be a number";
    }
    if (formData.stock && isNaN(Number(formData.stock))) {
      newErrors.stock = "Stock must be a number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <h2 className="text-neutral-900 font-semibold text-xl">
            {variant ? "Edit Variant" : "Add New Variant"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Mandatory Fields Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              Mandatory Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Pack Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="packSize"
                  value={formData.packSize}
                  onChange={handleChange}
                  placeholder="e.g., 100ml, 500g, 10*10 Strip"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.packSize ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.packSize && <p className="text-red-500 text-xs mt-1">{errors.packSize}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Quantity in stock"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.stock ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="₹"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.sellingPrice ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  MRP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  placeholder="₹"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.mrp ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.mrp && <p className="text-red-500 text-xs mt-1">{errors.mrp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  MOQ (Minimum Order Quantity) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="moq"
                  value={formData.moq}
                  onChange={handleChange}
                  placeholder="Minimum order quantity"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.moq ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.moq && <p className="text-red-500 text-xs mt-1">{errors.moq}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  placeholder="Batch/Lot number"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.batch ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.batch && <p className="text-red-500 text-xs mt-1">{errors.batch}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.expiryDate ? "border-red-500" : "border-neutral-300"
                  }`}
                />
                {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-600 mb-4 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
              Optional Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Pack Type</label>
                <input
                  type="text"
                  name="packType"
                  value={formData.packType}
                  onChange={handleChange}
                  placeholder="e.g., Box, Strip, Bottle"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Units per Pack</label>
                <input
                  type="text"
                  name="unitsPerPack"
                  value={formData.unitsPerPack}
                  onChange={handleChange}
                  placeholder="Number of units"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Number of Packs</label>
                <input
                  type="text"
                  name="numberOfPacks"
                  value={formData.numberOfPacks}
                  onChange={handleChange}
                  placeholder="Number of packs"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Min Order Qty</label>
                <input
                  type="text"
                  name="minOrderQty"
                  value={formData.minOrderQty}
                  onChange={handleChange}
                  placeholder="Minimum order quantity"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Order Qty</label>
                <input
                  type="text"
                  name="maxOrderQty"
                  value={formData.maxOrderQty}
                  onChange={handleChange}
                  placeholder="Maximum order quantity"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Manufacturing Date</label>
                <input
                  type="date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Stock Quantity</label>
                <input
                  type="text"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  placeholder="Stock quantity"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Discount %</label>
                <input
                  type="text"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="Discount percentage"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">GST %</label>
                <input
                  type="text"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  placeholder="GST percentage"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">HSN Code</label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="HSN code"
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-neutral-300 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-md"
            >
              {variant ? "Update Variant" : "Add Variant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VariantDetailPanel = ({ variant, onClose }: { variant: Variant; onClose: () => void }) => {
  const discountSlabs: DiscountSlab[] = variant.discountSlabs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-[#1a1a1a] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header - matching Figma with white background */}
        <div className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-10 border-b border-neutral-200">
          <h2 className="text-neutral-900 font-semibold text-lg">Variants Details</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pb-8 flex-1">
          <SectionHeader title="Packaging & Order Details" />
          <DetailRow label="Pack Type" value={variant.packType || `${variant.packSize}`} />
          <DetailRow label="Number of Units per Pack Type" value={variant.unitsPerPack || "100"} />
          <DetailRow label="Number of Packs" value={variant.numberOfPacks || "150 Box"} />
          <DetailRow label="Pack Size" value={variant.packSize ? `${variant.packSize}` : "150 packs x 100 units = 15,000 units"} />
          <DetailRow label="Min Order Qty" value={variant.minOrderQty || variant.moq} />
          <DetailRow label="Max Order Qty" value={variant.maxOrderQty || "5,000"} />

          <SectionHeader title="Batch Details" />
          <DetailRow label="Batch / Lot Number" value={variant.batch} />
          <DetailRow label="Manufacturing Date" value={variant.manufacturingDate || "18/02/2026"} />
          <DetailRow label="Expiry Date" value={variant.expiryDate} />
          <DetailRow label="Stock Quantity" value={variant.stockQuantity || variant.stock} />
          <DetailRow label="Date of Entry" value={variant.dateOfEntry || "20/02/2026"} />

          <SectionHeader title="Pricing Details" />
          <DetailRow label="MRP" value={variant.mrp ? `₹${variant.mrp}` : "₹1,500"} />
          <DetailRow label="Selling Price per Pack Size" value={variant.sellingPrice ? `₹${variant.sellingPrice}` : "₹1,200"} />
          <DetailRow label="Discount %" value={variant.discountPercent ? `${variant.discountPercent}%` : "20%"} />
          <DetailRow label="Final Price (after discounts)" value={variant.finalPrice ? `₹${variant.finalPrice}` : "₹960"} />

          <SectionHeader title="Tax & Billing" />
          <DetailRow label="GST %" value={variant.gst || "12"} />
          <DetailRow label="HSN Code" value={variant.hsnCode || "504"} />

          {/* Discount Slabs Table */}
          <SectionHeader title="Applied Discount Slabs" />
          <div className="mt-4 rounded-xl overflow-hidden border border-neutral-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-800">
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">Min Qt</th>
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">Max Qt</th>
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">Discount %</th>
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">Start date</th>
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">End Date</th>
                  <th className="py-2.5 px-3 text-left text-neutral-300 font-semibold text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {discountSlabs.length === 0 ? (
                  // Show sample rows matching Figma
                  [
                    { minQt: 130, maxQt: 200, discountPercent: 20, startDate: "18/02/2026", endDate: "18/10/2026" },
                    { minQt: 200, maxQt: 299, discountPercent: 25, startDate: "18/02/2026", endDate: "18/10/2026" },
                    { minQt: 300, maxQt: 500, discountPercent: 30, startDate: "18/02/2026", endDate: "18/10/2026" },
                  ].map((slab, idx) => (
                    <tr key={idx} className="border-t border-neutral-700">
                      <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.minQt}</td>
                      <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.maxQt}</td>
                      <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.discountPercent}%</td>
                      <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.startDate}</td>
                      <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.endDate}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-2">
                          <button className="text-purple-400 hover:text-purple-300 transition"><Pencil size={14} /></button>
                          <button className="text-red-400 hover:text-red-300 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : discountSlabs.map((slab, idx) => (
                  <tr key={idx} className="border-t border-neutral-700">
                    <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.minQt}</td>
                    <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.maxQt}</td>
                    <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.discountPercent}%</td>
                    <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.startDate}</td>
                    <td className="py-2.5 px-3 text-neutral-200 text-xs">{slab.endDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-2">
                        <button className="text-purple-400 hover:text-purple-300 transition"><Pencil size={14} /></button>
                        <button className="text-red-400 hover:text-red-300 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const VariantList: React.FC<VariantListProps> = ({ variants, onAdd, onEdit, onDelete }) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  const handleAddClick = () => {
    setEditingVariant(null);
    setShowVariantForm(true);
  };

  const handleEditClick = (variant: Variant) => {
    setEditingVariant(variant);
    setShowVariantForm(true);
  };

  const handleSaveVariant = (variantData: Omit<Variant, 'id'>) => {
    if (editingVariant) {
      // Edit existing variant - merge the new data with existing variant data
      const updatedVariant: Variant = {
        ...editingVariant,
        ...variantData,
      };
      onEdit(updatedVariant);
    } else {
      // Add new variant
      onAdd(variantData);
    }
    setShowVariantForm(false);
    setEditingVariant(null);
  };

  return (
    <>
      <div className="border border-neutral-200 rounded-xl p-6 bg-white shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Variants List</h2>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-purple-700 transition text-sm shadow-md"
          >
            <Plus size={18} />
            Add Variant
          </button>
        </div>
        <div className="border-b border-neutral-200 mb-4"></div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
            <thead className="bg-neutral-50 text-sm text-neutral-700">
              <tr>
                <th className="p-3 text-left font-semibold">Pack size</th>
                <th className="p-3 text-left font-semibold">Stock</th>
                <th className="p-3 text-left font-semibold">Selling Price</th>
                <th className="p-3 text-left font-semibold">MRP</th>
                <th className="p-3 text-left font-semibold">MOQ</th>
                <th className="p-3 text-left font-semibold">Batch</th>
                <th className="p-3 text-left font-semibold">Expiry Date</th>
                <th className="p-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-neutral-400 text-sm">
                    No variants added yet. Click &quot;Add Variant&quot; to get started.
                  </td>
                </tr>
              ) : variants.map(variant => (
                <tr 
                  key={variant.id} 
                  className="border-t border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition cursor-pointer" 
                  onClick={() => setSelectedVariant(variant)}
                >
                  <td className="p-3 font-medium">{variant.packSize || "—"}</td>
                  <td className="p-3">{variant.stock || "—"}</td>
                  <td className="p-3">{variant.sellingPrice ? `₹${variant.sellingPrice}` : "—"}</td>
                  <td className="p-3">{variant.mrp ? `₹${variant.mrp}` : "—"}</td>
                  <td className="p-3">{variant.moq || "—"}</td>
                  <td className="p-3">{variant.batch || "—"}</td>
                  <td className="p-3">{variant.expiryDate || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(variant);
                        }}
                        className="text-purple-600 hover:text-purple-800 transition"
                        title="Edit variant"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this variant?')) {
                            onDelete(variant.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete variant"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variant Form Modal */}
      {showVariantForm && (
        <VariantFormModal
          variant={editingVariant}
          onSave={handleSaveVariant}
          onClose={() => {
            setShowVariantForm(false);
            setEditingVariant(null);
          }}
        />
      )}

      {/* Variant Detail Panel (Figma style dark slide-over) */}
      {selectedVariant && (
        <VariantDetailPanel
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </>
  );
};

export default VariantList;