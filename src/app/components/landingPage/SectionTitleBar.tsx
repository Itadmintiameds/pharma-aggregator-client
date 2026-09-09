import Link from "next/link";
import Button from "@/src/app/commonComponents/Button";

interface SectionTitleBarProps {
  icon: React.ReactNode;
  title: string;
  viewAllHref?: string;
}

export default function SectionTitleBar({
  icon,
  title,
  viewAllHref = "#products",
}: SectionTitleBarProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-3">
        <span className="text-pneutral-900 shrink-0">{icon}</span>
        <h2 className="font-heading font-semibold text-h4 text-pneutral-900">{title}</h2>
      </div>
      <Link href={viewAllHref}>
        <Button variant="outline" size="md" shape="square" label="View All" className="w-[108px]" />
      </Link>
    </div>
  );
}
