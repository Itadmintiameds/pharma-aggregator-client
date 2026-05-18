import { useState } from "react";

type Props = {
  onFileSelect: (file: File | null) => void;
  existingFile?: string; // ✅ NEW
  label?: string;
  placeholder?: string;
  accept?: string;
};

export default function UploadInput({ 
  onFileSelect, 
  existingFile,
  label = "Upload Product Brochure / User Manual",
  placeholder = "Upload the Product Brochure",
  accept = "application/pdf"
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [removedExisting, setRemovedExisting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (accept === "application/pdf" && selectedFile.type !== "application/pdf") {
      alert("Only PDF allowed");
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setRemovedExisting(true); // ✅ this is the key fix
    onFileSelect(null);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-label-l3 font-semibold text-pneutral-900">
          {label}
        </label>
      )}

      <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-500 bg-white overflow-hidden">
        <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
          <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
        </div>

        <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
          {file || (existingFile && !removedExisting) ? (
            <div className="flex items-center bg-[#FDEBEB] text-sm px-3 py-2 rounded-lg max-w-full">
              <span className="truncate">
                {file ? file.name : existingFile?.split("/").pop()}
              </span>
              <button onClick={removeFile} className="ml-2">
                ✕
              </button>
            </div>
          ) : (
            <span className="text-[#969793]">{placeholder}</span>
          )}
        </div>

        {!file && (!existingFile || removedExisting) && (
          <label className="cursor-pointer px-4">
            <img src="/icons/UploadAddIcon.svg" className="w-6 h-6" />
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}

