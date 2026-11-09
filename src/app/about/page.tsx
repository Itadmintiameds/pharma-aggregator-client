import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";

export default function AboutPage() {
  return (
    <>
      <LandingHeader />

      <main className="pt-40 pb-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-h2 font-heading font-bold text-primary-900 mb-6">
            About TiaMeds
          </h1>
          <p className="text-p2 font-body text-neutral-700 leading-relaxed mb-6">
            TiaMeds is a B2B pharmaceutical marketplace connecting verified sellers with
            buyers across the pharmacy supply chain. Our platform brings AI-powered
            discovery, transparent pricing, and streamlined compliance to an industry that
            has long relied on fragmented, manual processes.
          </p>
          <p className="text-p2 font-body text-neutral-700 leading-relaxed mb-6">
            We work with pharmaceutical companies, distributors, and retail pharmacies to
            make sourcing molecules, drugs, consumables, and healthcare products faster,
            safer, and more reliable.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            <div className="rounded-lg border border-neutral-100 p-6">
              <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-2">
                Our Mission
              </h3>
              <p className="text-p4 font-body text-neutral-600">
                Transforming pharmaceutical B2B trading with AI-powered technology.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-100 p-6">
              <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-2">
                Who We Serve
              </h3>
              <p className="text-p4 font-body text-neutral-600">
                Sellers, distributors, and buyers across the pharmacy supply chain.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-100 p-6">
              <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-2">
                What We Offer
              </h3>
              <p className="text-p4 font-body text-neutral-600">
                Verified listings, transparent pricing, and compliant sourcing tools.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
