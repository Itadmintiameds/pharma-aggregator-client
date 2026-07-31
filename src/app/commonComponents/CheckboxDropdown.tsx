"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxDropdownProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  showSelectAll?: boolean;
  disabled?: boolean;
  readOnly?: boolean; 
  className?: string;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  label,
  placeholder = "Select options",
  required = false,
  icon,
  error,
  showSelectAll = true,
  disabled = false,
  readOnly = false,  
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");  
  const [activeIndex, setActiveIndex] = useState(0);  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  // Filter options based on search term, always shown in ascending order
  const filteredOptions = (
    searchTerm
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options
  ).slice().sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Handle keyboard typing for search 
  useEffect(() => {
    if (!isOpen || readOnly || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Type to search
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

      // Arrow navigation
      if (e.key === "ArrowDown") {
        setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        e.preventDefault();
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, activeIndex, readOnly, disabled]);


  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const toggleOption = (value: string) => {
    if (disabled || readOnly) return;  
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (disabled || readOnly) return;  
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  // CHANGE 1: Show search term when typing
  const getDisplayText = () => {
    if (isOpen && searchTerm) return searchTerm;
    if (selectedValues.length) {
      return options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");
    }
    return placeholder;
  };

  const displayText = getDisplayText();

  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

  // CHANGED: Updated styles to match your Dropdown
  const getVariantStyles = (): string => {
    if (disabled) 
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
    if (readOnly) 
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
    if (error) 
      return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-1 focus:ring-warning-500";
    
    return "border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 cursor-pointer";
  };

  const handleClick = () => {
    if (disabled || readOnly) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
          disabled ? "text-pneutral-500" : "text-pneutral-900"
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
              {displayText}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
              isOpen && !readOnly && !disabled ? "rotate-180" : ""
            } ${
              disabled ? "text-pneutral-500" : readOnly ? "text-pneutral-800" : "text-pneutral-800"
            }`}
          />
        </div>

        {isOpen && !disabled && !readOnly && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {showSelectAll && options.length > 0 && (
                <div
                  className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
                  onClick={toggleSelectAll}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => {}}
                    className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                  />
                  <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
                    Select All
                  </label>
                </div>
              )}

              {filteredOptions.map((option, idx) => (
                <div
                  key={option.value}
                  className={`flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
                    ${activeIndex === idx ? "bg-purple-100" : ""}
                  `}
                  onClick={() => toggleOption(option.value)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => {}}
                    className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                  />
                  <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}

              {filteredOptions.length === 0 && (
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

export default CheckboxDropdown;












// code dated 16.06.2026.........

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { ChevronDown } from "lucide-react";

// export interface CheckboxOption {
//   value: string;
//   label: string;
// }

// interface CheckboxDropdownProps {
//   options: CheckboxOption[];
//   selectedValues: string[];
//   onChange: (selectedValues: string[]) => void;
//   label?: string;
//   placeholder?: string;
//   required?: boolean;
//   icon?: React.ReactNode;
//   error?: string;
//   showSelectAll?: boolean;
//   disabled?: boolean;
//   readOnly?: boolean; 
//   className?: string;
// }

// const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
//   options,
//   selectedValues,
//   onChange,
//   label,
//   placeholder = "Select options",
//   required = false,
//   icon,
//   error,
//   showSelectAll = true,
//   disabled = false,
//   readOnly = false,  
//   className = "",
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");  
//   const [activeIndex, setActiveIndex] = useState(0);  
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

//   // Filter options based on search term
//   const filteredOptions = searchTerm
//     ? options.filter((opt) =>
//         opt.label.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     : options;

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setIsOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("keydown", handleEsc);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("keydown", handleEsc);
//     };
//   }, []);

//   // Handle keyboard typing for search 
//   useEffect(() => {
//     if (!isOpen || readOnly || disabled) return;

//     const handleKeyDown = (e: KeyboardEvent) => {
//       // Type to search
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

//       // Arrow navigation
//       if (e.key === "ArrowDown") {
//         setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
//         e.preventDefault();
//       }
//       if (e.key === "ArrowUp") {
//         setActiveIndex((prev) => Math.max(prev - 1, 0));
//         e.preventDefault();
//       }

//       if (e.key === "Escape") {
//         setIsOpen(false);
//         setSearchTerm("");
//         e.preventDefault();
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [isOpen, filteredOptions, activeIndex, readOnly, disabled]);


//   useEffect(() => {
//     if (!isOpen) {
//       setSearchTerm("");
//       setActiveIndex(0);
//     }
//   }, [isOpen]);

//   const toggleOption = (value: string) => {
//     if (disabled || readOnly) return;  
//     const newSelected = selectedValues.includes(value)
//       ? selectedValues.filter((v) => v !== value)
//       : [...selectedValues, value];
//     onChange(newSelected);
//   };

//   const toggleSelectAll = () => {
//     if (disabled || readOnly) return;  
//     if (selectedValues.length === options.length) {
//       onChange([]);
//     } else {
//       onChange(options.map((opt) => opt.value));
//     }
//   };

//   const displayText = selectedValues.length
//     ? options
//         .filter((opt) => selectedValues.includes(opt.value))
//         .map((opt) => opt.label)
//         .join(", ")
//     : placeholder;

//   const allSelected = options.length > 0 && selectedValues.length === options.length;
//   const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

//   // CHANGED: Updated styles to match your Dropdown
//   const getVariantStyles = (): string => {
//     if (disabled) 
//       return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
//     if (readOnly) 
//       return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
//     if (error) 
//       return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-1 focus:ring-warning-500";
    
//     return "border-pneutral-300 text-pneutral-800 bg-white focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300 cursor-pointer";
//   };

//   const handleClick = () => {
//     if (disabled || readOnly) return;
//     setIsOpen(!isOpen);
//   };

//   return (
//     <div className={`flex flex-col w-full ${className}`}>
//       {label && (
//         <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
//           disabled ? "text-pneutral-500" : "text-pneutral-900"
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
//               {displayText}
//             </span>
//           </div>
//           <ChevronDown
//             className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
//               isOpen && !readOnly && !disabled ? "rotate-180" : ""
//             } ${
//               disabled ? "text-pneutral-500" : readOnly ? "text-pneutral-800" : "text-pneutral-800"
//             }`}
//           />
//         </div>

//         {isOpen && !disabled && !readOnly && (
//           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
//             <div className="max-h-60 overflow-y-auto">
//               {showSelectAll && options.length > 0 && (
//                 <div
//                   className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
//                   onClick={toggleSelectAll}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={allSelected}
//                     ref={(input) => {
//                       if (input) input.indeterminate = someSelected;
//                     }}
//                     onChange={() => {}}
//                     className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                   />
//                   <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
//                     Select All
//                   </label>
//                 </div>
//               )}

//               {filteredOptions.map((option, idx) => (
//                 <div
//                   key={option.value}
//                   className={`flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
//                     ${activeIndex === idx ? "bg-purple-100" : ""}
//                   `}
//                   onClick={() => toggleOption(option.value)}
//                   onMouseEnter={() => setActiveIndex(idx)}
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedValues.includes(option.value)}
//                     onChange={() => {}}
//                     className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                   />
//                   <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
//                     {option.label}
//                   </label>
//                 </div>
//               ))}

//               {filteredOptions.length === 0 && (
//                 <div className="px-4 py-3 text-sm text-neutral-500 text-center">
//                   No options available
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {error && (
//         <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500">
//           {error}
//         </p>
//       )}
//     </div>
//   );
// };

// export default CheckboxDropdown;

