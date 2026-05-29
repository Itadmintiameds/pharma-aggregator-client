export const formatDate = (value?: string) => {
  if (!value) return "";

  // already dd/mm/yyyy → return as is
  if (value.includes("/") && value.split("/")[0].length === 2) {
    return value;
  }

  // yyyy/mm/dd or yyyy-mm-dd → convert to dd/mm/yyyy
  const separator = value.includes("-") ? "-" : "/";
  const [year, month, day] = value.split(separator);

  return `${day}/${month}/${year}`;
};