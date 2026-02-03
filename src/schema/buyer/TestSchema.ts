import { z } from "zod";
import {UserRoleEnum} from "../TestRoleSchema"

export const AdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  role: UserRoleEnum.extract(["ADMIN"]),
  createdAt: z.string(),
});

export type Admin = z.infer<typeof AdminSchema>;