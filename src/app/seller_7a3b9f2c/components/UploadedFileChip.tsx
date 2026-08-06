"use client";

import React from "react";

interface UploadedFileChipProps {
  url: string;
  // Real original filename, when the backend has it. Falls back to
  // deriveFileName(url) when omitted/empty (e.g. older data uploaded before
  // the backend started persisting filenames).
  fileName?: string;
  // id of the hidden <input type="file"> this field already uses to pick a
  // replacement — Edit just clicks it, re-using the exact same onChange path
  // a fresh pick already goes through.
  inputId: string;
  onDelete: () => void;
}

// Best-effort display name — the backend only ever gives us the uploaded
// file's URL, never the original filename, so this derives something
// readable from the S3 key's last path segment.
const deriveFileName = (url: string): string => {
  try {
    const withoutQuery = url.split("?")[0];
    const lastSegment = withoutQuery.substring(withoutQuery.lastIndexOf("/") + 1);
    return decodeURIComponent(lastSegment) || "Uploaded file";
  } catch {
    return "Uploaded file";
  }
};

export default function UploadedFileChip({ url, fileName: providedFileName, inputId, onDelete }: UploadedFileChipProps) {
  const fileName = providedFileName && providedFileName.trim() ? providedFileName : deriveFileName(url);

  return (
    <div className="flex items-center h-[52px] border-2 border-primary-200 rounded-xl overflow-hidden bg-white">
      <div className="w-13 h-full bg-white border-r border-primary-100 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-pneutral-700">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>

      <div className="flex-1 h-full flex items-center px-3 min-w-0">
        <span className="text-p4 font-body font-medium text-primary-800 bg-success-50 rounded-md px-2 py-1 truncate">
          {fileName}
        </span>
      </div>

      <div className="flex items-center gap-3 pr-4 shrink-0">
        <button
          type="button"
          onClick={() => document.getElementById(inputId)?.click()}
          aria-label="Replace file"
          title="Edit"
          className="text-pneutral-700 hover:text-primary-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          aria-label="View file"
          title="View"
          className="text-pneutral-700 hover:text-primary-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete file"
          title="Delete"
          className="text-warning-500 hover:text-warning-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
