"use client";

import { ReactNode, useRef, useState } from "react";
import Link from "next/link";

interface DescriptionBlock {
  label: string | null;
  text: string;
}

export interface SpecRow {
  label: string;
  value?: ReactNode;
}

// Seller descriptions are "Label: text" lines. Technical details belong in the specification table, the rest reads
// as the product description.
const SPEC_LABEL = /composition|strength|storage|pack|manufacturer|marketer|dimension|size|material|shelf|ingredient|dosage|form/i;

type TabId = "description" | "specification";

/**
 * Product information in tabs: Description (brand, the seller's write-up) and Key Specification (a table of the
 * technical lines from the description plus GST, HSN, order limits, seller and batch dates). A tab only appears when
 * it has something to show. Arrow keys move between tabs.
 */
export default function ProductInfoTabs({
  manufacturerName,
  blocks,
  facts,
}: {
  manufacturerName?: string;
  blocks: DescriptionBlock[];
  /** Extra specification rows (GST, HSN, order limits ...); rows without a value are skipped. */
  facts: SpecRow[];
}) {
  const descriptionBlocks = blocks.filter((b) => !(b.label && SPEC_LABEL.test(b.label)));
  const specRows: SpecRow[] = [
    ...blocks.filter((b) => b.label && SPEC_LABEL.test(b.label)).map((b) => ({ label: b.label as string, value: b.text })),
    ...facts.filter((f) => f.value != null && f.value !== ""),
  ];

  const tabs: { id: TabId; label: string }[] = [];
  if (manufacturerName || descriptionBlocks.length > 0) tabs.push({ id: "description", label: "Description" });
  if (specRows.length > 0) tabs.push({ id: "specification", label: "Key Specification" });

  const [selected, setSelected] = useState<TabId>("description");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (tabs.length === 0) return null;
  const active = tabs.some((t) => t.id === selected) ? selected : tabs[0].id;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setSelected(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
  };

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-label="Product information">
      <div role="tablist" aria-label="Product information" onKeyDown={onKeyDown} className="flex overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelected(tab.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:bg-primary-50 ${
                isActive ? "border-primary-800 text-primary-800" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === "description" && (
        <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" className="space-y-2 p-4 text-[13px] leading-relaxed text-gray-700">
          {manufacturerName && (
            <p>
              <span className="font-semibold text-gray-900">Brand: </span>
              <Link
                href={`/search?manufacturerName=${encodeURIComponent(manufacturerName)}`}
                className="font-medium text-primary-800 underline decoration-primary-300 underline-offset-2 hover:decoration-primary-800"
              >
                {manufacturerName}
              </Link>
            </p>
          )}
          {descriptionBlocks.map((block, index) =>
            block.label ? (
              <p key={index}>
                <span className="font-semibold text-gray-900">{block.label}: </span>
                {block.text}
              </p>
            ) : (
              <p key={index}>{block.text}</p>
            )
          )}
        </div>
      )}

      {active === "specification" && (
        <div role="tabpanel" id="panel-specification" aria-labelledby="tab-specification" className="p-4">
          <dl className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 text-[13px]">
            {specRows.map((row, index) => (
              <div key={`${row.label}-${index}`} className="grid sm:grid-cols-[12rem_1fr]">
                <dt className="bg-gray-50 px-3 py-2 font-semibold text-gray-900">{row.label}</dt>
                <dd className="px-3 py-2 text-gray-700">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
