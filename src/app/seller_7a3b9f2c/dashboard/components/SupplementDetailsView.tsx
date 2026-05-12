import React from "react";

const ROW: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  alignItems: "center",
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
    <p style={VALUE_TEXT}>
      {value ?? "—"}
    </p>
  </div>
);

/** Shows an image thumbnail + a link to view full size, or falls back to text. */
const NutritionalInfoRow = ({
  imageUrl,
  textValue,
}: {
  imageUrl?: string | null;
  textValue?: string | null;
}) => (
  <div style={{ ...ROW, alignItems: "flex-start" }}>
    <div style={ROW_LABEL}>
      <span style={LABEL_TEXT}>Nutritional Information</span>
    </div>
    <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
      {imageUrl ? (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" title="View nutritional information image">
          <img
            src={imageUrl}
            alt="Nutritional Information"
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #D5D5D4",
              cursor: "pointer",
            }}
          />
        </a>
      ) : (
        <p style={VALUE_TEXT}>{textValue ?? "—"}</p>
      )}
    </div>
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

      {/* Nutritional Information: shows image thumbnail if URL exists, else text */}
      <NutritionalInfoRow
        imageUrl={data.nutritionalInformationImageUrl}
        textValue={data.nutritionalInformation}
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
