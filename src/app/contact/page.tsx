import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";

export default function ContactPage() {
  return (
    <>
      <LandingHeader />

      <main className="pt-40 pb-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-h2 font-heading font-bold text-primary-900 mb-6">
            Contact Us
          </h1>
          <p className="text-p2 font-body text-neutral-700 leading-relaxed mb-12">
            Have a question about becoming a seller or buyer on TiaMeds? Reach out and
            our team will get back to you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="rounded-lg border border-neutral-100 p-6 flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-500 flex items-center justify-center">
                <FaMapMarkerAlt className="w-4 h-4 text-neutral-50" />
              </div>
              <div>
                <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-1">
                  Address
                </h3>
                <p className="text-p4 font-body text-neutral-600">
                  No. 59, 2nd Floor of Dakshina Murthy Towers, Devanooru,
                  <br />
                  Rajeevnagara 2nd Stage, Udayagiri, Mysore
                  <br />
                  Karnataka – 570019
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-100 p-6 flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-500 flex items-center justify-center">
                <FaPhone className="w-4 h-4 text-neutral-50" />
              </div>
              <div>
                <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-1">
                  Help Center
                </h3>
                <p className="text-p4 font-body text-neutral-600">
                  Reach our support team for any platform-related queries.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-100 p-6 flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-500 flex items-center justify-center">
                <FaEnvelope className="w-4 h-4 text-neutral-50" />
              </div>
              <div>
                <h3 className="text-p1 font-heading font-semibold text-primary-800 mb-1">
                  Email
                </h3>
                <a
                  href="mailto:support@tiameds.ai"
                  className="text-p4 font-body text-primary-700 hover:text-primary-800 transition-colors"
                >
                  support@tiameds.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
