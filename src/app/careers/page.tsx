import { FaRocket, FaHandshake, FaHeartbeat, FaEnvelope } from "react-icons/fa";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import PageHero from "@/src/app/components/landingPage/PageHero";

const VALUES = [
  {
    icon: FaHeartbeat,
    title: "Healthcare with purpose",
    text: "Your work helps pharmacies and distributors source medicines faster, safer and more reliably.",
  },
  {
    icon: FaRocket,
    title: "Build with technology",
    text: "We apply AI-powered discovery and modern engineering to an industry that still runs on manual processes.",
  },
  {
    icon: FaHandshake,
    title: "Trust and transparency",
    text: "Verified sellers, clear pricing and honest communication - with customers and with each other.",
  },
];

export default function CareersPage() {
  return (
    <>
      <LandingHeader />

      <main>
        <PageHero
          eyebrow="Careers"
          title="Careers at TiaMeds"
          description="Help us transform pharmaceutical B2B trading. We are building the marketplace the pharmacy supply chain has been missing."
        >
          <a
            href="mailto:support@tiameds.ai?subject=Careers%20at%20TiaMeds"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-base font-semibold text-primary-900 transition-colors hover:bg-neutral-100"
          >
            <FaEnvelope className="h-4 w-4" /> Send your profile
          </a>
        </PageHero>

        <div className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-16">
            <section>
              <h2 className="text-[28px] font-heading font-bold text-primary-900">What we care about</h2>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {VALUES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-primary-800">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-xl font-heading font-semibold text-primary-900">{title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-neutral-600">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-secondary-50 px-6 py-12 text-center sm:px-10">
              <h2 className="text-[28px] font-heading font-bold text-primary-900">Open positions</h2>
              <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-neutral-700">
                There are no roles listed right now, but we are always glad to hear from talented people. Send us your
                profile and tell us how you would like to help.
              </p>
              <a
                href="mailto:support@tiameds.ai?subject=Careers%20at%20TiaMeds"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-800"
              >
                <FaEnvelope className="h-4 w-4" /> support@tiameds.ai
              </a>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
