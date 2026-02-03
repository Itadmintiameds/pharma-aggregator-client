
import { z } from "zod";

export const UserRoleEnum = z.enum(["ADMIN", "SELLER", "BUYER"]);

export type UserRole = z.infer<typeof UserRoleEnum>;
