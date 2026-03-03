import { z } from "zod";

// IFSC format: 4 letters, then 0, then 6 alphanumeric characters
export const ifscSchema = z
  .string()
  .length(11, "IFSC code must be exactly 11 characters")
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format");