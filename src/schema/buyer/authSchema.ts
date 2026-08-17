import { z } from "zod";

export const buyerSignupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must be at least 8 characters and contain at least one uppercase, one lowercase, one number and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type BuyerSignupFormValues = z.infer<typeof buyerSignupSchema>;

export const buyerLoginSchema = z.object({
  username: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type BuyerLoginFormValues = z.infer<typeof buyerLoginSchema>;

export const buyerOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type BuyerOtpFormValues = z.infer<typeof buyerOtpSchema>;

export const buyerResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase, one lowercase, one number and one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type BuyerResetPasswordFormValues = z.infer<typeof buyerResetPasswordSchema>;
