"use client";

import React, { useEffect } from "react";

interface SaveBeforeLogoutModalProps {
  isOpen: boolean;
  saving: boolean;
  onCancel: () => void;
  onSaveAndLogout: () => void;
  onLogoutWithoutSaving: () => void;
}

// Shown only when Logout is clicked while on the registration wizard page —
// styled after the dashboard's LogoutConfirmationModal, but with a third
// option since there's actual in-progress form data at stake here that the
// dashboard's plain "confirm logout" prompt never has to consider.
const SaveBeforeLogoutModal = ({
  isOpen,
  saving,
  onCancel,
  onSaveAndLogout,
  onLogoutWithoutSaving,
}: SaveBeforeLogoutModalProps) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onCancel, saving]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div
        className="relative w-full max-w-110 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Save before you go?</h2>

          <p className="mb-8 text-sm text-gray-500">
            You have registration details filled in on this page. Save them as a draft
            before logging out so you can pick up where you left off.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSaveAndLogout}
            disabled={saving}
            className="rounded-xl bg-primary-800 px-4 py-3 font-medium text-white transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save & Logout"}
          </button>

          <button
            type="button"
            onClick={onLogoutWithoutSaving}
            disabled={saving}
            className="rounded-xl border-2 border-red-600 bg-white px-4 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Logout without saving
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveBeforeLogoutModal;
