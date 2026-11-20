"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { ReturnEvidence } from "@/src/types/buyer/returns";

// Thumbnails of the photos/videos on a return; clicking one opens it full size. Shared by the buyer and
// seller return cards. The links are signed for ~15 minutes, so a page left open longer needs a refresh.
export default function ReturnEvidenceGallery({ evidence }: { evidence: ReturnEvidence[] }) {
  const [open, setOpen] = useState<ReturnEvidence | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (evidence.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {evidence.map((item, i) => {
          const video = item.contentType.startsWith("video/");
          return (
            <button
              key={item.evidenceId}
              type="button"
              onClick={() => setOpen(item)}
              aria-label={`Open ${video ? "video" : "photo"} ${i + 1}`}
              className="relative h-14 w-14 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
            >
              {video ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  <Play size={16} className="absolute inset-0 m-auto fill-white text-white drop-shadow" />
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={`Return photo ${i + 1}`} className="h-full w-full object-cover" />
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-3xl">
            {open.contentType.startsWith("video/") ? (
              <video src={open.url} controls autoPlay playsInline className="max-h-[85vh] max-w-full rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.url} alt="Return photo" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
