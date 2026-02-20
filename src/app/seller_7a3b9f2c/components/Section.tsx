import React from "react";
import SellerJourney from "./SellerJourney";

interface SectionProps {
  onRegisterClick: () => void;
  onProductOnboardingClick?: () => void;
}

export default function Section({ onRegisterClick, onProductOnboardingClick }: SectionProps) {
  const cards = [
    {
      title: "Boost Sales By 50%",
      description:
        "Drive up to 50% more sales through better call efficiency & territory coverage."
    },
    {
      title: "Cut Cost By 30%+",
      description:
        "Go digital, eliminate paper, manual entry, & printing to slash admin overheads."
    },
    {
      title: "100% Compliance & Visibility",
      description:
        "Maintain GPS verified, audit ready records & track your entire supply chain in real time."
    },
    {
      title: "Data Driven Management",
      description:
        "Gain instant insights from live dashboards & make faster smarter fields."
    },
    {
      title: "Instant Approvals & Insights",
      description:
        "Approve tours and expenses in minutes, not weeks, with automated workflows."
    },
    {
      title: "Empower Reps on the Field",
      description:
        "Work offline or online, file DCRs in minutes, & get paid faster with automated claims."
    }
  ];

  return (
    <section className="px-6 md:px-12 py-12">
      <h1 className="text-4xl font-bold text-left mb-8">
        Why Tiameds?
      </h1>
      <p className="max-w-3xl text-left text-gray-600 text-base md:text-lg mb-10">
        By partnering with Tiamed, you gain access to a broader network of pharmaceutical companies and buyers, expanding your potential customer base
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="
              rounded-2xl border border-gray-200 p-6
              shadow-sm
              transition-all duration-200 ease-out
              hover:shadow-[0_1px_10px_rgba(117,27,181,0.35)]
              hover:border-[#751bb5]
              hover:-translate-y-2
              hover:scale-[1.02]
            "
          >
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </div>
        ))}
      </div>
      <div>
        <SellerJourney />
      </div>


      <div className="mt-12 flex justify-center gap-4">
        <button
          onClick={onRegisterClick}
          className="
            rounded-xl bg-[#2D0066] 
            px-10 py-4 
            text-white text-lg font-semibold 
            hover:bg-[#751bb5] transition
            hover:scale-90
            hover:shadow-[0_8px_24px_rgba(117,27,181,0.35)]
          "
        >
          Register / Sign Up
        </button>

        <button
          onClick={onProductOnboardingClick}
          className="
            rounded-xl bg-[#751bb5] 
            px-10 py-4 
            text-white text-lg font-semibold 
            hover:bg-[#2D0066] transition
            hover:scale-90
            hover:shadow-[0_8px_24px_rgba(45,0,102,0.35)]
          "
        >
          Add Products
        </button>
      </div>
    </section>
  );
}