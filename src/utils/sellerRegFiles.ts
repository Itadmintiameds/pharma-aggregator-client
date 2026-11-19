// Shared by SellerRegister.tsx and its per-step form components
// (CompanyForm/CoordinatorForm/BankForm/DocumentForm) so both the state
// mapping and the "already uploaded" UI branch agree on what counts as a
// real, already-uploaded file URL.
//
// True only when `url` is a real, usable file URL - the backend writes the
// literal string "PENDING" into *FileUrl columns as a placeholder before a
// real file has been uploaded, so that sentinel must never be treated as
// "already uploaded".
export const isRealFileUrl = (url?: string | null): boolean => {
  return !!url && url !== "PENDING";
};
