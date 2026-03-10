// src/schema/seller/loginSchema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email/Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export type OTPFormData = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type EmailFormData = z.infer<typeof emailSchema>;







// import { z } from "zod";

// // Email/Username validation
// const emailOrUsernameSchema = z.string()
//   .min(1, { message: "Email/Username is required" })
//   .refine(
//     (val) => {
//       const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
//       const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(val);
//       return isEmail || isUsername;
//     },
//     { message: "Enter a valid email or username (3-20 characters, letters, numbers, underscore only)" }
//   );

// // Password validation for login (just required, no complex rules for login)
// const passwordSchema = z.string()
//   .min(1, { message: "Password is required" });

// // New password validation for reset (strong password requirements)
// const newPasswordSchema = z.string()
//   .min(8, { message: "Password must be at least 8 characters" })
//   .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
//   .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
//   .regex(/\d/, { message: "Password must contain at least one number" })
//   .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character (e.g., !@#$%^&*)" });

// // Login schema
// export const loginSchema = z.object({
//   email: emailOrUsernameSchema,
//   password: passwordSchema,
// });

// // Reset password schema
// export const resetPasswordSchema = z.object({
//   newPassword: newPasswordSchema,
//   confirmPassword: z.string().min(1, { message: "Please confirm your password" })
// }).refine((data) => data.newPassword === data.confirmPassword, {
//   message: "Passwords do not match",
//   path: ["confirmPassword"],
// });

// // OTP schema (6 digits only)
// export const otpSchema = z.object({
//   otp: z.string()
//     .length(6, { message: "OTP must be exactly 6 digits" })
//     .regex(/^\d+$/, { message: "OTP must contain only numbers" })
// });

// // Types
// export type LoginFormData = z.infer<typeof loginSchema>;
// export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
// export type OTPFormData = z.infer<typeof otpSchema>;








// import { z } from "zod";

// // Email/Username validation: accepts either a valid email or a username (3-20 alphanumeric + underscore)
// const emailOrUsernameSchema = z.string()
//   .min(1, { message: "Email/Username is required" })
//   .refine(
//     (val) => {
//       const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
//       const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(val);
//       return isEmail || isUsername;
//     },
//     { message: "Enter a valid email or username" }
//   );

// // Password validation: at least 8 chars, with uppercase, lowercase, number, and special character
// const passwordSchema = z.string()
//   .min(8, { message: "Password must be at least 8 characters" })
//   .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
//   .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
//   .regex(/\d/, { message: "Password must contain at least one number" })
//   .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character (e.g., !@#$%^&*)" });

// // Login schema
// export const loginSchema = z.object({
//   email: emailOrUsernameSchema,
//   password: passwordSchema,
// });

// // OTP schema: exactly 6 digits
// export const otpSchema = z.object({
//   otp: z.string()
//     .length(6, { message: "OTP must be exactly 6 digits" })
//     .regex(/^\d+$/, { message: "OTP must contain only numbers" })
// });

// // Type exports
// export type LoginFormData = z.infer<typeof loginSchema>;
// export type OTPFormData = z.infer<typeof otpSchema>;