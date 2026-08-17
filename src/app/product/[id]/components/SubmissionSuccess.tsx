import { CheckCircle2 } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";

interface SubmissionSuccessProps {
  referenceId: string;
  heading: string;
  message: string;
  onSubmitAnother: () => void;
  onBackToProduct: () => void;
}

export default function SubmissionSuccess({
  referenceId,
  heading,
  message,
  onSubmitAnother,
  onBackToProduct,
}: SubmissionSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-16 h-16 rounded-full bg-success-50 text-success-600 flex items-center justify-center mb-5">
        <CheckCircle2 size={32} />
      </div>
      <h2 className="text-h5 font-heading font-semibold text-pneutral-900 mb-2">{heading}</h2>
      <p className="text-p3 font-body text-pneutral-600 max-w-md">{message}</p>
      <p className="text-label-l2 font-heading text-pneutral-500 mt-4 bg-neutral-50 px-3 py-1.5 rounded-md">
        Reference ID: <span className="font-semibold text-pneutral-800">{referenceId}</span>
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Button variant="outline" size="md" label="Submit another request" onClick={onSubmitAnother} />
        <Button variant="filled" size="md" label="Back to product" onClick={onBackToProduct} />
      </div>
    </div>
  );
}
