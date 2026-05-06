import React from "react";

const ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "12px 16px",
  borderBottom: "1px solid #D5D5D4",
  gap: 16,
};

const ROW_LABEL: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 4,
  flex: "1 1 0",
  minWidth: 0,
};

const LABEL_TEXT: React.CSSProperties = {
  color: "var(--Colors-Primary-Neutral-pneutral-700, #5A5B58)",
  fontSize: 16,
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 600,
  lineHeight: "22px",
  wordWrap: "break-word",
  margin: 0,
};

const VALUE_TEXT: React.CSSProperties = {
  color: "var(--Colors-Primary-Neutral-pneutral-800, #3C3D3A)",
  fontSize: 16,
  fontFamily: "'Open Sans', sans-serif",
  fontWeight: 400,
  lineHeight: "22px",
  wordWrap: "break-word",
  textAlign: "right",
  flex: "1 1 0",
  margin: 0,
};

const FieldRow = ({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
}) => (
  <div style={{ ...ROW, alignItems: multiline ? "flex-start" : "center" }}>
    <div style={ROW_LABEL}>
      <span style={LABEL_TEXT}>{label}</span>
    </div>
    <p style={{ ...VALUE_TEXT, textAlign: multiline ? "left" : "right" }}>
      {value ?? "—"}
    </p>
  </div>
);

export default function SupplementDetailsView({ data }: { data: any }) {
  if (!data) return null;

  return (
    <>
      <FieldRow label="Age Group" value={data.ageGroupName} />
      <FieldRow label="Gender" value={data.gender} />
      <FieldRow label="Therapeutic Category" value={data.therapeuticCategoryName} />
      <FieldRow label="Therapeutic Subcategory" value={data.therapeuticSubCategoryName} />
      <FieldRow label="Veg / Non-Veg Indicator" value={data.vegOrNonVegIndicator} />
      <FieldRow label="Flavour" value={data.flavourName} />

      <FieldRow
        label="Active Ingredients"
        value={data.activeIngredients}
        multiline
      />

      <FieldRow
        label="Other Ingredients"
        value={data.otherIngredients}
        multiline
      />

      <FieldRow
        label="Allergen Information"
        value={data.allergenInformation}
        multiline
      />

      <FieldRow
        label="Nutritional Information"
        value={data.nutritionalInformation}
        multiline
      />

      <FieldRow
        label="Product Claims"
        value={data.productClaims}
        multiline
      />

      <FieldRow label="Net Quantity" value={data.netQuantity} />
      <FieldRow label="Strength" value={data.strength} />
      <FieldRow label="Dosage Form" value={data.dosageFormName} />
      <FieldRow label="Country of Origin" value={data.countryName} />
    </>
  );
}
