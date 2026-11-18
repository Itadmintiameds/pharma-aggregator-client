"use client";

import { useEffect, useState } from "react";
import BuyerCartDrawer from "@/src/app/buyer_e8d45a1b/dashboard/components/BuyerCartDrawer";
import { useBuyerCartDrawer } from "@/src/app/buyer_e8d45a1b/context/BuyerCartDrawerContext";
import MiniCartBar from "./MiniCartBar";

/**
 * Site-wide side cart plus the sticky "View Cart" bar. The drawer (and the buyer-status lookup inside it) is only
 * mounted the first time the cart is opened, so pages that never open it pay nothing.
 */
export default function GlobalCartDrawer() {
  const { isOpen } = useBuyerCartDrawer();
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);

  return (
    <>
      <MiniCartBar />
      {/* Render on the very first open too, not one frame later. */}
      {(everOpened || isOpen) && <BuyerCartDrawer />}
    </>
  );
}
