
import { api } from "@/src/utils/api";
import { AdminSchema, Admin } from "@/src/schema/admin/TestSchema";

export const getAdmins = async (): Promise<Admin[]> => {
  const res = await api.get("/admins");

  return res.data.map((admin: unknown) =>
    AdminSchema.parse(admin)
  );
};
