import { z } from "zod";

export const checkoutAddressSchema = z.object({
  deliveryName: z.string().min(2, "Name is required"),
  deliveryPhone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(15, "Enter a valid phone number"),
  deliveryAddressLine: z.string().min(5, "Address is required"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryDistrict: z.string().min(2, "District is required"),
  deliveryState: z.string().min(2, "State is required"),
  deliveryPinCode: z
    .string()
    .min(6, "Enter a valid 6-digit pin code")
    .max(6, "Enter a valid 6-digit pin code"),
});

export type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>;
