"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface CommonDropdownProps {
  options: DropdownOption[];
  value: string | number | null;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  readOnly?: boolean;  
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Dropdown: React.FC<CommonDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  isLoading = false,
  isDisabled = false,
  readOnly = false,  
  label,
  error,
  required = false,
  icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter options based on typed text
  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard typing and navigation
  useEffect(() => {
    if (!isOpen || readOnly || isDisabled) return;  

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle character keys for searching (a-z, 0-9, space)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        setSearchTerm((prev) => prev + e.key);
        searchTimeoutRef.current = setTimeout(() => {
          setSearchTerm("");
        }, 15000);
        e.preventDefault();
      }

      // Backspace to delete search term
      if (e.key === "Backspace") {
        setSearchTerm((prev) => prev.slice(0, -1));
        e.preventDefault();
      }

      // Arrow down navigation
      if (e.key === "ArrowDown") {
        setActiveIndex((prev) =>
          Math.min(prev + 1, filteredOptions.length - 1)
        );
        e.preventDefault();
      }

      // Arrow up navigation
      if (e.key === "ArrowUp") {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        e.preventDefault();
      }

      // Enter to select active option
      if (e.key === "Enter" && filteredOptions[activeIndex]) {
        const selected = filteredOptions[activeIndex];
        onChange(selected.value, selected.label);
        setIsOpen(false);
        setSearchTerm("");
        e.preventDefault();
      }

      // Escape to close dropdown
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, activeIndex, onChange, readOnly, isDisabled]);  

  // Reset state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === String(value));
  
  // Show search term when typing, otherwise show selected option or placeholder
  const displayValue = isOpen && searchTerm ? searchTerm : (selectedOption?.label || placeholder);

  const handleSelect = (selectedValue: string, selectedLabel: string) => {
    if (readOnly || isDisabled) return;  
    onChange(selectedValue, selectedLabel);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClick = () => {
    if (isDisabled || isLoading || readOnly) return;  
    setIsOpen(!isOpen);
  };

  const getVariantStyles = (): string => {
    if (isDisabled) 
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
    if (readOnly) 
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
    if (error) 
      return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-1 focus:ring-warning-500";
    
    // Default enabled state
    return "border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 cursor-pointer";
  };

  return (
    <div className={`flex flex-col gap-0 w-full ${className}`}>
      {label && (
        <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
          isDisabled ? "text-pneutral-500" : "text-pneutral-900"
        }`}>
          {icon && <span className="text-neutral-600 text-lg mr-2">{icon}</span>}
          {label}
          {required && <span className="text-warning-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <div
          className={`
            w-full border outline-none transition-all duration-200 flex items-center justify-between
            h-[52px] min-h-[52px] max-h-[56px] px-4 py-3 text-base rounded-lg
            ${getVariantStyles()}
          `}
          onClick={handleClick}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && <span className="text-pneutral-500 shrink-0">{icon}</span>}
            <span className="truncate">
              {isLoading ? "Loading..." : displayValue}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
              isOpen && !readOnly && !isDisabled ? "rotate-180" : ""
            } ${
              isDisabled ? "text-pneutral-500" : readOnly ? "text-pneutral-800" : "text-pneutral-800"
            }`}
          />
        </div>

        {isOpen && !isDisabled && !isLoading && !readOnly && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.value}
                    className={`px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
                      ${
                        String(value) === opt.value
                          ? "bg-purple-50 text-primary-900 font-medium"
                          : "text-neutral-900"
                      }
                      ${activeIndex === idx ? "bg-purple-100" : ""}
                    `}
                    onClick={() => handleSelect(opt.value, opt.label)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Dropdown;













// old code dated 15.06.2026

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { ChevronDown } from "lucide-react";

// export interface DropdownOption {
//   value: string;
//   label: string;
// }

// interface CommonDropdownProps {
//   options: DropdownOption[];
//   value: string | number | null;
//   onChange: (value: string, label: string) => void;
//   placeholder?: string;
//   isLoading?: boolean;
//   isDisabled?: boolean;
//   readOnly?: boolean;  
//   label?: string;
//   error?: string;
//   required?: boolean;
//   icon?: React.ReactNode;
//   className?: string;
// }

// const Dropdown: React.FC<CommonDropdownProps> = ({
//   options,
//   value,
//   onChange,
//   placeholder = "Select option",
//   isLoading = false,
//   isDisabled = false,
//   readOnly = false,  
//   label,
//   error,
//   required = false,
//   icon,
//   className = "",
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeIndex, setActiveIndex] = useState(0);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Filter options based on typed text
//   const filteredOptions = searchTerm
//     ? options.filter((opt) =>
//         opt.label.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     : options;

//   // Handle click outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Handle keyboard typing and navigation
//   useEffect(() => {
//     if (!isOpen || readOnly || isDisabled) return;  

//     const handleKeyDown = (e: KeyboardEvent) => {
//       // Handle character keys for searching (a-z, 0-9, space)
//       if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
//         if (searchTimeoutRef.current) {
//           clearTimeout(searchTimeoutRef.current);
//         }
//         setSearchTerm((prev) => prev + e.key);
//         searchTimeoutRef.current = setTimeout(() => {
//           setSearchTerm("");
//         }, 15000);
//         e.preventDefault();
//       }

//       // Arrow down navigation
//       if (e.key === "ArrowDown") {
//         setActiveIndex((prev) =>
//           Math.min(prev + 1, filteredOptions.length - 1)
//         );
//         e.preventDefault();
//       }

//       // Arrow up navigation
//       if (e.key === "ArrowUp") {
//         setActiveIndex((prev) => Math.max(prev - 1, 0));
//         e.preventDefault();
//       }

//       // Enter to select active option
//       if (e.key === "Enter" && filteredOptions[activeIndex]) {
//         const selected = filteredOptions[activeIndex];
//         onChange(selected.value, selected.label);
//         setIsOpen(false);
//         setSearchTerm("");
//         e.preventDefault();
//       }

//       // Escape to close dropdown
//       if (e.key === "Escape") {
//         setIsOpen(false);
//         setSearchTerm("");
//         e.preventDefault();
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [isOpen, filteredOptions, activeIndex, onChange, readOnly, isDisabled]);  

//   // Reset state when dropdown closes
//   useEffect(() => {
//     if (!isOpen) {
//       setSearchTerm("");
//       setActiveIndex(0);
//     }
//   }, [isOpen]);

//   const selectedOption = options.find((opt) => opt.value === String(value));
//   const displayValue = selectedOption?.label || placeholder;

//   const handleSelect = (selectedValue: string, selectedLabel: string) => {
//     if (readOnly || isDisabled) return;  
//     onChange(selectedValue, selectedLabel);
//     setIsOpen(false);
//     setSearchTerm("");
//   };

//   const handleClick = () => {
//     if (isDisabled || isLoading || readOnly) return;  
//     setIsOpen(!isOpen);
//   };

//   const getVariantStyles = (): string => {
//     if (isDisabled) 
//       return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
//     if (readOnly) 
//       return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
//     if (error) 
//       return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-1 focus:ring-warning-500";
    
//     // Default enabled state
//     return "border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 cursor-pointer";
//   };

//   return (
//     <div className={`flex flex-col gap-0 w-full ${className}`}>
//       {label && (
//         <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
//           isDisabled ? "text-pneutral-500" : "text-pneutral-900"
//         }`}>
//           {icon && <span className="text-neutral-600 text-lg mr-2">{icon}</span>}
//           {label}
//           {required && <span className="text-warning-500 ml-1">*</span>}
//         </label>
//       )}

//       <div className="relative" ref={dropdownRef}>
//         <div
//           className={`
//             w-full border outline-none transition-all duration-200 flex items-center justify-between
//             h-[52px] min-h-[52px] max-h-[56px] px-4 py-3 text-base rounded-lg
//             ${getVariantStyles()}
//           `}
//           onClick={handleClick}
//         >
//           <div className="flex items-center gap-2 flex-1">
//             {icon && <span className="text-pneutral-500 shrink-0">{icon}</span>}
//             <span className="truncate">
//               {isLoading ? "Loading..." : displayValue}
//             </span>
//           </div>
//           <ChevronDown
//             className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
//               isOpen && !readOnly && !isDisabled ? "rotate-180" : ""
//             } ${
//               isDisabled ? "text-pneutral-500" : readOnly ? "text-pneutral-800" : "text-pneutral-800"
//             }`}
//           />
//         </div>

//         {isOpen && !isDisabled && !isLoading && !readOnly && (
//           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
//             <div className="max-h-60 overflow-y-auto">
//               {filteredOptions.length > 0 ? (
//                 filteredOptions.map((opt, idx) => (
//                   <div
//                     key={opt.value}
//                     className={`px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
//                       ${
//                         String(value) === opt.value
//                           ? "bg-purple-50 text-primary-900 font-medium"
//                           : "text-neutral-900"
//                       }
//                       ${activeIndex === idx ? "bg-purple-100" : ""}
//                     `}
//                     onClick={() => handleSelect(opt.value, opt.label)}
//                     onMouseEnter={() => setActiveIndex(idx)}
//                   >
//                     <span className="text-sm">{opt.label}</span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-4 py-3 text-sm text-neutral-500 text-center">
//                   No options available
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {error && (
//   <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500">
//     {error}
//   </p>
// )}
//     </div>
//   );
// };

// export default Dropdown;