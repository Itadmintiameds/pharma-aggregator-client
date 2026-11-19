import Link from "next/link";
import { FaEnvelope, FaMapMarkerAlt, FaHeadset, FaClock } from "react-icons/fa";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import PageHero from "@/src/app/components/landingPage/PageHero";

const TOPICS = [
  "Becoming a seller or buyer on TiaMeds",
  "Orders, returns and quotes",
  "Account, profile and verification",
  "Partnerships and general enquiries",
];

const card = "flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm";
const iconBox = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-primary-800";

export default function ContactPage() {
  return (
    <>
      <LandingHeader />

      <main>
        <PageHero
          eyebrow="Contact"
          title="Contact Us"
          description="Have a question about becoming a seller or buyer on TiaMeds? Reach out and our team will get back to you."
        >
          <a
            href="mailto:support@tiameds.ai"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-900 transition-colors hover:bg-neutral-100"
          >
            <FaEnvelope className="h-3.5 w-3.5" /> Email support
          </a>
        </PageHero>

        <div className="px-4 py-8 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-5">
            <div className="grid gap-4 lg:col-span-3">
              <div className={card}>
                <span className={iconBox}>
                  <FaEnvelope className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-heading font-semibold text-primary-900">Email</h2>
                  <p className="mt-0.5 text-sm text-neutral-600">Best for orders, account and onboarding questions.</p>
                  <a
                    href="mailto:support@tiameds.ai"
                    className="mt-1.5 inline-block text-sm font-semibold text-primary-700 no-underline hover:text-primary-900"
                  >
                    support@tiameds.ai
                  </a>
                </div>
              </div>

              <div className={card}>
                <span className={iconBox}>
                  <FaHeadset className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-heading font-semibold text-primary-900">Help Center</h2>
                  <p className="mt-0.5 text-sm text-neutral-600">Reach our support team for any platform-related queries.</p>
                  <p className="mt-1.5 inline-flex items-center gap-2 text-xs text-neutral-500">
                    <FaClock className="h-3 w-3" /> Tip: include your order or product ID so we can help faster.
                  </p>
                </div>
              </div>

              <div className={card}>
                <span className={iconBox}>
                  <FaMapMarkerAlt className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-heading font-semibold text-primary-900">Address</h2>
                  <address className="mt-0.5 text-sm not-italic leading-relaxed text-neutral-600">
                    No. 59, 2nd Floor of Dakshina Murthy Towers, Devanooru,
                    <br />
                    Rajeevnagara 2nd Stage, Udayagiri, Mysore
                    <br />
                    Karnataka – 570019
                  </address>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-xl bg-secondary-50 p-5 lg:col-span-2">
              <h2 className="text-base font-heading font-semibold text-primary-900">How can we help?</h2>
              <ul className="mt-3 space-y-2">
                {TOPICS.map((topic) => (
                  <li key={topic} className="flex gap-2.5 text-sm text-neutral-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-700" />
                    {topic}
                  </li>
                ))}
              </ul>
              <Link href="/careers" className="mt-4 inline-block text-sm font-semibold text-primary-800 no-underline hover:text-primary-600">
                Looking for a career at TiaMeds? →
              </Link>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
