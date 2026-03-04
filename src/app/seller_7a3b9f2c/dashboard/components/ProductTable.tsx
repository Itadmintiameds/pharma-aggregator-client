"use client";

import React from "react";
import { Edit, Eye, Trash2 } from "lucide-react";

const products = new Array(6).fill({
  name: "Paracetamol",
  category: "Drugs",
  price: "₹20",
  stock: 10000,
  status: "Active",
});

const ProductTable = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-neutral-100 text-left">
          <tr>
            <th className="p-4">Thumbnail</th>
            <th className="p-4">Product Name</th>
            <th className="p-4">Category</th>
            <th className="p-4">Price</th>
            <th className="p-4">Stock</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product, index) => (
            <tr
              key={index}
              className="border-t border-neutral-100 hover:bg-neutral-50 transition"
            >
              <td className="p-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
              </td>

              <td className="p-4">{product.name}</td>
              <td className="p-4">{product.category}</td>
              <td className="p-4">{product.price}</td>
              <td className="p-4">{product.stock}</td>

              <td className="p-4">
                <span className="px-3 py-1 text-xs rounded-md bg-success-50 text-success-900">
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;