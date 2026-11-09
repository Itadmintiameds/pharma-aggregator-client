// Category-aware license number rules. Same rules the seller registration form
// (DocumentForm) applies, so a license number accepted at registration is also
// accepted when it is added or edited later from the seller profile.

export type LicenseValidationCategory = "DRUG" | "FSSAI" | "COSMETIC" | "MEDICAL_DEVICE" | "OTHER";

export const getLicenseValidationCategory = (productName: string): LicenseValidationCategory => {
  const name = productName.toLowerCase();
  if (name.includes("drug")) return "DRUG";
  if (name.includes("cosmetic")) return "COSMETIC";
  if (name.includes("medical device")) return "MEDICAL_DEVICE";
  if (name.includes("food") || name.includes("supplement") || name.includes("nutraceutical") || name.includes("nutrition")) return "FSSAI";
  return "OTHER";
};

export const LICENSE_MAX_LENGTH = 30;

export const LICENSE_PLACEHOLDER: Record<LicenseValidationCategory, string> = {
  DRUG: "e.g., KA-BLR-20B-123456",
  FSSAI: "e.g., 11223344556677",
  COSMETIC: "e.g., COS-KA-2026-12345",
  MEDICAL_DEVICE: "e.g., MD-KA-2026-123456",
  OTHER: "e.g., TN/CBE/20B-12345",
};

export const formatLicenseNumber = (value: string, category: LicenseValidationCategory): string => {
  const upper = value.toUpperCase();
  if (category === "FSSAI") return upper.replace(/[^0-9]/g, "");
  if (category === "COSMETIC") return upper.replace(/[^A-Z0-9\-]/g, "");
  return upper.replace(/[^A-Z0-9\/\-]/g, "");
};

/** Characters a key press may add, per category (used to block invalid keys). */
export const isAllowedLicenseChar = (key: string, category: LicenseValidationCategory): boolean => {
  if (category === "FSSAI") return /^[0-9]$/.test(key);
  if (category === "COSMETIC") return /^[A-Za-z0-9\-]$/.test(key);
  return /^[A-Za-z0-9\/\-]$/.test(key);
};

export const validateLicenseNumber = (value: string, licenseName: string, category: LicenseValidationCategory): string | null => {
  const cleaned = value.trim().toUpperCase();

  if (!cleaned) return `${licenseName} Number is required`;

  switch (category) {
    case "FSSAI":
      if (!/^\d+$/.test(cleaned)) return `${licenseName} Number must contain digits only`;
      if (cleaned.length !== 14) return `${licenseName} Number must be exactly 14 digits`;
      return null;
    case "COSMETIC":
      if (cleaned.length < 10) return `${licenseName} Number must be at least 10 characters`;
      if (cleaned.length > LICENSE_MAX_LENGTH) return `${licenseName} Number cannot exceed ${LICENSE_MAX_LENGTH} characters`;
      if (!/^[A-Z0-9\-]+$/.test(cleaned)) return `${licenseName} Number can only contain letters, numbers and "-"`;
      return null;
    case "DRUG":
    case "MEDICAL_DEVICE":
      if (cleaned.length < 10) return `${licenseName} Number must be at least 10 characters`;
      if (cleaned.length > LICENSE_MAX_LENGTH) return `${licenseName} Number cannot exceed ${LICENSE_MAX_LENGTH} characters`;
      if (!/^[A-Z0-9\/\-]+$/.test(cleaned)) return `${licenseName} Number can only contain letters, numbers, "/" and "-"`;
      return null;
    default: {
      if (cleaned.length < 10) return `${licenseName} Number must be at least 10 characters`;
      if (cleaned.length > LICENSE_MAX_LENGTH) return `${licenseName} Number cannot exceed ${LICENSE_MAX_LENGTH} characters`;
      const patterns = [
        /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,
        /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,
        /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,
        /^\d{2}[A-Z]?-\d{3,10}$/,
        /^\d{2}\/\d{2}-\d{3,10}$/,
        /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,
        /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,
        /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,
      ];
      return patterns.some((p) => p.test(cleaned)) ? null : `Invalid ${licenseName} Number format`;
    }
  }
};
