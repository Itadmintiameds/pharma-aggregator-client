"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Variant {
  id: string;
  packSize: string;
  stock: string;
  sellingPrice: string;
  mrp: string;
  moq: string;
  batch: string;
  expiryDate: string;
}

interface VariantListProps {
  variants: Variant[];
  onAdd: () => void;
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h6 font-regular">Variants List</h2>

        <button
          onClick={onAdd}
          className="px-4 py-2 bg-[#9F75FC] text-white rounded-lg font-semibold flex items-center gap-2"
        >
          + Add Variant
        </button>
      </div>

      <div className="border-b border-neutral-200 mb-4"></div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
          <thead className="bg-neutral-100 text-sm text-neutral-700">
            <tr>
              <th className="p-3 text-left">Pack size</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Selling Price</th>
              <th className="p-3 text-left">MRP</th>
              <th className="p-3 text-left">MOQ</th>
              <th className="p-3 text-left">Batch</th>
              <th className="p-3 text-left">Expiry Date</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center p-4 text-neutral-400"
                >
                  No variants added yet
                </td>
              </tr>
            ) : (
              variants.map((variant) => (
                <tr
                  key={variant.id}
                  className="border-t text-sm text-neutral-700"
                >
                  <td className="p-3">{variant.packSize}</td>
                  <td className="p-3">{variant.stock}</td>
                  <td className="p-3">₹{variant.sellingPrice}</td>
                  <td className="p-3">₹{variant.mrp}</td>
                  <td className="p-3">{variant.moq}</td>
                  <td className="p-3">{variant.batch}</td>
                  <td className="p-3">{variant.expiryDate}</td>

                  <td className="p-3 flex gap-3">
                    <button
                      onClick={() => onEdit(variant)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Pencil size={20} />
                    </button>

                    <button
                      onClick={() => onDelete(variant.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
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

export default VariantList;