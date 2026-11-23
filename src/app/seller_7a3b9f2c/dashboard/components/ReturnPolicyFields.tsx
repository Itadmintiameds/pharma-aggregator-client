import Input from "@/src/app/commonComponents/Input";
import { DEFAULT_RETURN_PERIOD_DAYS, ReturnPolicyForm } from "@/src/utils/returnPolicy";

interface ReturnPolicyFieldsProps {
  value: ReturnPolicyForm;
  onChange: (value: ReturnPolicyForm) => void;
  error?: string;
}

const options = [
  { value: true, label: "Returnable" },
  { value: false, label: "Not returnable" },
];

// Whether buyers may return the product and, if so, within how many days of delivery.
export default function ReturnPolicyFields({ value, onChange, error }: ReturnPolicyFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="font-heading font-medium text-[16px] leading-[24px] text-pneutral-900">
          Return Policy
          <span className="text-warning-500 ml-1">*</span>
        </label>
        <div className="flex gap-6 mt-1">
          {options.map((option) => (
            <label key={option.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="returnable"
                checked={value.returnable === option.value}
                onChange={() =>
                  onChange({
                    returnable: option.value,
                    returnPeriodDays: option.value
                      ? value.returnPeriodDays || String(DEFAULT_RETURN_PERIOD_DAYS)
                      : "",
                  })
                }
                className="accent-purple-700 w-4 h-4"
              />
              <span className="text-base [font-family:'Open_Sans',sans-serif] font-normal [color:#3C3D3A]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {value.returnable && (
        <Input
          label="Return Period (days)"
          name="returnPeriodDays"
          id="returnPeriodDays"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 7"
          value={value.returnPeriodDays}
          // Whole days only: ignore any keystroke or paste that would add a decimal point, sign or exponent.
          onChange={(e) => {
            if (/^\d*$/.test(e.target.value)) onChange({ ...value, returnPeriodDays: e.target.value });
          }}
          hint="Days after delivery within which the buyer can raise a return"
          error={error}
          required
        />
      )}
    </div>
  );
}
