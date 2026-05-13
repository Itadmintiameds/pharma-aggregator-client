// FileUploadTags.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface FileTag {
  id: string;
  label: string;
  tagCode: string;
  file: File | null;
  fileName: string;
  uploading: boolean;
  isUploaded: boolean;
}

interface FileUploadTagsProps {
  label: string;
  required?: boolean;
  tags: FileTag[];
  onTagsChange: (tags: FileTag[]) => void;
  onFileUpload: (tagId: string, file: File) => Promise<void> | void;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  showTagCodes?: boolean;
  tagColorScheme?: "purple" | "green" | "blue";
  error?: string;
}

const FileUploadTags: React.FC<FileUploadTagsProps> = ({
  label,
  required = false,
  tags,
  onTagsChange,
  onFileUpload,
  accept = ".pdf,.jpg,.jpeg,.png",
  placeholder = "Upload the Certificate",
  disabled = false,
  maxTags,
  showTagCodes = true,
  tagColorScheme = "purple",
  error,
}) => {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  const getTagColorClasses = (isUploaded: boolean) => {
    if (isUploaded) {
      return "bg-green-100 text-green-800 border border-green-300";
    }
    switch (tagColorScheme) {
      case "purple":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      case "blue":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "green":
        return "bg-green-100 text-green-800 border border-green-300";
      default:
        return "bg-purple-100 text-purple-800 border border-purple-300";
    }
  };

  const handleTagClick = (tagId: string) => {
    if (disabled) return;
    document.getElementById(`file-upload-${tagId}`)?.click();
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const updatedTags = tags.filter((tag) => tag.id !== tagId);
    onTagsChange(updatedTags);
  };

  const handleFileChange = async (tagId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Update uploading state
      setUploadingIds((prev) => new Set(prev).add(tagId));
      
      // Update tag with uploading status
      const updatedTags = tags.map((tag) =>
        tag.id === tagId ? { ...tag, uploading: true } : tag
      );
      onTagsChange(updatedTags);
      
      try {
        await onFileUpload(tagId, file);
        
        // Update tag with uploaded status
        const finalTags = tags.map((tag) =>
          tag.id === tagId
            ? {
                ...tag,
                file,
                fileName: file.name,
                uploading: false,
                isUploaded: true,
              }
            : tag
        );
        onTagsChange(finalTags);
      } catch (error) {
        console.error("Upload failed:", error);
        // Reset uploading state on error
        const errorTags = tags.map((tag) =>
          tag.id === tagId ? { ...tag, uploading: false } : tag
        );
        onTagsChange(errorTags);
      } finally {
        setUploadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tagId);
          return newSet;
        });
      }
    }
  };

  const canAddMoreTags = maxTags ? tags.length < maxTags : true;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-l3 text-neutral-700 font-semibold">
        {label} {required && <span className="text-warning-500">*</span>}
      </label>
      <div
        className={`w-full border rounded-xl flex items-center overflow-hidden h-14 ${
          error ? "border-red-500" : "border-neutral-300"
        }`}
      >
        <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
          <Image src="/icons/upload.png" alt="Upload" width={20} height={20} />
        </div>
        <div className="flex flex-wrap gap-2 px-3 flex-1">
          {tags.map((tag) => (
            <div
              key={tag.id}
              onClick={() => !disabled && handleTagClick(tag.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${getTagColorClasses(tag.isUploaded)}`}
            >
              {showTagCodes && <span>{tag.tagCode}</span>}
              {!showTagCodes && <span>{tag.label}</span>}
              {(tag.uploading || uploadingIds.has(tag.id)) && (
                <span className="text-xs">Uploading...</span>
              )}
              {!disabled && (
                <button
                  onClick={(e) => handleRemoveTag(tag.id, e)}
                  className="ml-1 hover:text-gray-900 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {tags.length === 0 && (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {/* Hidden file inputs for each tag */}
      {tags.map((tag) => (
        <input
          key={`input-${tag.id}`}
          id={`file-upload-${tag.id}`}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFileChange(tag.id, e)}
        />
      ))}
    </div>
  );
};

export default FileUploadTags;