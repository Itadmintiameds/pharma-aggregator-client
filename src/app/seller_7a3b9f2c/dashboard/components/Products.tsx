"use client";

import React from "react";
import ProductList from "./ProductList";

interface ProductsProps {
  setCurrentView: React.Dispatch<React.SetStateAction<any>>;
  setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

const Products = ({ setCurrentView, setSelectedProductId }: ProductsProps) => {
  return (
    <div>
      <ProductList
        setCurrentView={setCurrentView}
        setSelectedProductId={setSelectedProductId}
      />
    </div>
  );
};

export default Products;