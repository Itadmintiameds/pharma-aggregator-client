"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PromptState {
  title: string;
  resolve: (value: string | null) => void;
}

/**
 * Promise-based replacement for window.prompt() — same call-site shape
 * (`const reason = await promptReason("...")`) but renders a proper centered,
 * themed modal instead of the browser's native (unstyled, top-of-page) prompt
 * dialog. Returns null if the user cancels/dismisses, matching window.prompt's
 * own null-on-cancel behavior.
 *
 * Rendered via a portal straight to document.body rather than inline where
 * the hook is called — this component is used from cards deep inside list
 * pages, and a plain `position: fixed` div nested under an ancestor with a
 * transform/filter/perspective (common on hover-animated cards) gets sized
 * relative to THAT ancestor instead of the viewport, collapsing into a tiny
 * box instead of a proper full-screen-centered modal. Portaling to body
 * sidesteps that entirely, regardless of where the hook is used from.
 */
export function useReasonPrompt() {
  const [state, setState] = useState<PromptState | null>(null);
  const [value, setValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const promptReason = useCallback((title: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setValue("");
      setState({ title, resolve });
    });
  }, []);

  const close = (result: string | null) => {
    state?.resolve(result);
    setState(null);
  };

  const modal =
    mounted && state
      ? createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
            onClick={() => close(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6"
              style={{ width: "min(28rem, 100%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-h6 font-heading font-semibold text-pneutral-900 mb-3">{state.title}</h3>
              <textarea
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                placeholder="Optional — add a reason..."
                style={{ width: "100%" }}
                className="block px-3.5 py-2.5 border border-neutral-200 rounded-xl text-p3 font-body text-pneutral-900
                  bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 focus:bg-white resize-none"
              />
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => close(null)}
                  className="px-4 py-2 rounded-xl text-p3 font-body font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => close(value)}
                  className="px-4 py-2 rounded-xl text-p3 font-body font-semibold bg-primary-900 text-white hover:bg-primary-800"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return { promptReason, modal };
}
