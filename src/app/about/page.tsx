import Link from "next/link";
import { FaBullseye, FaUsers, FaShieldAlt, FaTags, FaBrain, FaCheckCircle } from "react-icons/fa";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import PageHero from "@/src/app/components/landingPage/PageHero";

const PILLARS = [
  {
    icon: FaBullseye,
    title: "Our Mission",
    text: "Transforming pharmaceutical B2B trading with AI-powered technology.",
  },
  {
    icon: FaUsers,
    title: "Who We Serve",
    text: "Sellers, distributors, and buyers across the pharmacy supply chain.",
  },
  {
    icon: FaShieldAlt,
    title: "What We Offer",
    text: "Verified listings, transparent pricing, and compliant sourcing tools.",
  },
];

const FEATURES = [
  { icon: FaBrain, title: "AI-powered discovery", text: "Find molecules, brands and therapeutic products in seconds." },
  { icon: FaTags, title: "Transparent pricing", text: "Clear unit pricing and quotes, so buyers compare with confidence." },
  { icon: FaCheckCircle, title: "Streamlined compliance", text: "Verified sellers and licence checks built into every listing." },
];

export default function AboutPage() {
  return (
    <>
      <LandingHeader />

      <main>
        <PageHero
          eyebrow="About us"
          title="About TiaMeds"
          description="A B2B pharmaceutical marketplace connecting verified sellers with buyers across the pharmacy supply chain."
        >
          <Link
            href="/contact"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-900 transition-colors hover:bg-neutral-100"
          >
            Contact us
          </Link>
          <Link
            href="/careers"
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Join our team
          </Link>
        </PageHero>

        <div className="px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Story */}
            <section className="grid gap-4 lg:grid-cols-5 lg:gap-8">
              <h2 className="text-xl font-heading font-bold leading-snug text-primary-900 lg:col-span-2">
                Bringing structure to a fragmented industry
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-neutral-700 lg:col-span-3">
                <p>
                  TiaMeds is a B2B pharmaceutical marketplace connecting verified sellers with buyers across the pharmacy
                  supply chain. Our platform brings AI-powered discovery, transparent pricing, and streamlined compliance
                  to an industry that has long relied on fragmented, manual processes.
                </p>
                <p>
                  We work with pharmaceutical companies, distributors, and retail pharmacies to make sourcing molecules,
                  drugs, consumables, and healthcare products faster, safer, and more reliable.
                </p>
              </div>
            </section>

            {/* Pillars */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 text-primary-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-base font-heading font-semibold text-primary-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{text}</p>
                </div>
              ))}
            </section>

            {/* Features */}
            <section className="rounded-xl bg-secondary-50 px-4 py-6 sm:px-6">
              <h2 className="text-xl font-heading font-bold text-primary-900">Why teams choose TiaMeds</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
