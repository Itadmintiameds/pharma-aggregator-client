import { useState } from "react";

type Props = {
  onFileSelect: (file: File | null) => void;
  existingFile?: string; // ✅ NEW
};

export default function UploadInput({ onFileSelect, existingFile }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [removedExisting, setRemovedExisting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
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
      <label className="text-label-l3 font-semibold text-neutral-700">
        Upload Product Brochure / User Manual
      </label>

      <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
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
            <span className="text-[#969793]">Upload the Product Brochure</span>
          )}
        </div>

        {!file && (!existingFile || removedExisting) && (
          <label className="cursor-pointer px-4">
            <img src="/icons/UploadAddIcon.svg" className="w-6 h-6" />
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}

// type Props = {
//   onFileSelect: (file: File | null) => void;
// };

// export default function UploadInput({ onFileSelect }: Props) {
//   const [file, setFile] = useState<File | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;

//     if (selectedFile.type !== "application/pdf") {
//       alert("Only PDF allowed");
//       return;
//     }

//     setFile(selectedFile);
//     onFileSelect(selectedFile);
//   };

//   const removeFile = () => {
//     setFile(null);
//     onFileSelect(null);
//   };

//   return (
//     <div className="flex flex-col gap-1">
//       {/* ✅ Label (no required *) */}
//       <label className="text-label-l3 font-semibold text-neutral-700">
//         Upload Product Brochure / User Manual
//       </label>

//       {/* ✅ Input-like container */}
//       <div
//         className="flex items-center w-full h-14 rounded-2xl border
//   border-neutral-500 focus-within:border-[#4B0082]
//   bg-white overflow-hidden transition-colors duration-200"
//       >
//         {/* ✅ Left Icon Section */}
//         <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
//           <img
//             src="/icons/UploadIcon.svg"
//             alt="upload"
//             className="w-6 h-6 object-contain"
//           />
//         </div>

//         {/* ✅ Content */}
//         <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
//           {file ? (
//             <div className="flex items-center bg-[#FDEBEB] text-[#1E1E1D] text-sm px-3 py-2 rounded-lg max-w-full">
//               <span className="truncate">{file.name}</span>
//               <button
//                 onClick={removeFile}
//                 className="ml-2 text-[#1E1E1D] cursor-pointer"
//               >
//                 ✕
//               </button>
//             </div>
//           ) : (
//             <span className="text-[#969793] font-normal">
//               Upload the Product Brochure
//             </span>
//           )}
//         </div>

//         {/* ✅ Upload Button */}
//         {!file && (
//           <label className="cursor-pointer text-xl px-4">
//             <img
//               src="/icons/UploadAddIcon.svg"
//               alt="upload"
//               className="w-6 h-6 object-contain"
//             />
//             <input
//               type="file"
//               accept="application/pdf"
//               className="hidden"
//               onChange={handleFileChange}
//             />
//           </label>
//         )}
//       </div>
//     </div>
//   );
// }
