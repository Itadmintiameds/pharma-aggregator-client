"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadReturnEvidence } from "@/src/services/buyer/returnService";
import {
  RETURN_EVIDENCE_MAX_FILES,
  RETURN_EVIDENCE_MAX_IMAGE_MB,
  RETURN_EVIDENCE_MAX_VIDEO_MB,
  RETURN_EVIDENCE_TYPES,
  evidenceFileError,
} from "@/src/types/buyer/returns";

export interface EvidenceFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  // Set once the file is in S3.
  key?: string;
  error?: string;
}

// Photos/videos for a return. Each file starts uploading to S3 as soon as it is picked, so submitting the
// return only has to send the keys.
export default function ReturnEvidencePicker({
  buyerId,
  files,
  onChange,
  required,
  disabled,
}: {
  buyerId: string;
  files: EvidenceFile[];
  onChange: (update: (files: EvidenceFile[]) => EvidenceFile[]) => void;
  required: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Free the preview URLs when the form goes away.
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl)), []);

  const patch = (id: string, change: Partial<EvidenceFile>) =>
    onChange((prev) => prev.map((f) => (f.id === id ? { ...f, ...change } : f)));

  const upload = async (item: EvidenceFile) => {
    patch(item.id, { error: undefined, progress: 0 });
    try {
      const key = await uploadReturnEvidence(buyerId, item.file, (progress) => patch(item.id, { progress }));
      patch(item.id, { key, progress: 100 });
    } catch (err) {
      patch(item.id, { error: err instanceof Error ? err.message : "Upload failed." });
    }
  };

  const add = (picked: FileList | null) => {
    if (!picked) return;
    const room = Math.max(RETURN_EVIDENCE_MAX_FILES - files.length, 0);
    setNotice(
      picked.length > room
        ? `Only ${RETURN_EVIDENCE_MAX_FILES} files can be attached; ${picked.length - room} were left out.`
        : null
    );
    const added = Array.from(picked)
      .slice(0, room)
      .map((file) => ({
        // Not crypto.randomUUID: it only exists on https/localhost, and the app is also opened over LAN http.
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        error: evidenceFileError(file) ?? undefined,
      }));
    onChange((prev) => [...prev, ...added]);
    added.filter((f) => !f.error).forEach(upload);
  };

  const remove = (item: EvidenceFile) => {
    URL.revokeObjectURL(item.previewUrl);
    setNotice(null);
    onChange((prev) => prev.filter((f) => f.id !== item.id));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-p4 font-body text-pneutral-700">
        Photos or videos of the product{required ? "" : " (optional)"}
        <span className="block text-xs text-pneutral-500">
          Up to {RETURN_EVIDENCE_MAX_FILES} files · photos up to {RETURN_EVIDENCE_MAX_IMAGE_MB} MB, videos up to{" "}
          {RETURN_EVIDENCE_MAX_VIDEO_MB} MB. Show the damage, label, batch number or expiry date.
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {files.map((item) => (
          <div
            key={item.id}
            className={`relative h-20 w-20 overflow-hidden rounded-lg border bg-white ${
              item.error ? "border-red-400" : "border-neutral-300"
            }`}
            title={item.error ?? item.file.name}
          >
            {item.file.type.startsWith("video/") ? (
              <video src={item.previewUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
            )}
            {!item.key && !item.error && (
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-neutral-200">
                <div className="h-full bg-primary-700 transition-all" style={{ width: `${item.progress}%` }} />
              </div>
            )}
            {item.error && !evidenceFileError(item.file) && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => upload(item)}
                className="absolute inset-x-0 bottom-0 bg-red-600/90 py-0.5 text-[10px] font-semibold text-white"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(item)}
              aria-label={`Remove ${item.file.name}`}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {files.length < RETURN_EVIDENCE_MAX_FILES && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-400 bg-white text-[11px] text-pneutral-600 hover:bg-neutral-50 disabled:opacity-40"
          >
            <ImagePlus size={18} />
            Add
          </button>
        )}
      </div>

      {notice && <p className="text-xs text-amber-700">{notice}</p>}
      {files.filter((f) => f.error).map((f) => (
        <p key={f.id} className="text-xs text-red-600">
          {f.error}
        </p>
      ))}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={RETURN_EVIDENCE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
