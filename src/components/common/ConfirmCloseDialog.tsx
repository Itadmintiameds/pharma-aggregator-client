"use client";

import { createPortal } from "react-dom";

interface ConfirmCloseDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

/**
 * Small "are you sure?" dialog shown when a user clicks outside a popup,
 * so an accidental outside click doesn't silently discard it.
 *
 * Rendered via a portal to document.body: popups it's nested inside often
 * set backdrop-filter/filter on their overlay, which creates a containing
 * block for position:fixed descendants — without the portal this dialog
 * gets scoped to that ancestor's flex layout instead of the viewport.
 */
export default function ConfirmCloseDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Discard changes?",
  message = "Are you sure you want to close this? Unsaved changes will be lost.",
}: ConfirmCloseDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            No, go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes, close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
