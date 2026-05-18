"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function useNavigationGuard() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const pendingUrl = useRef<string | null>(null);

  const blockNavigation = (url: string) => {
    pendingUrl.current = url;
    setShowModal(true);
  };

  const confirmNavigation = () => {
    setShowModal(false);

    if (pendingUrl.current) {
      router.push(pendingUrl.current);
      pendingUrl.current = null;
    }
  };

  const cancelNavigation = () => {
    setShowModal(false);
    pendingUrl.current = null;
  };

  return {
    showModal,
    blockNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}