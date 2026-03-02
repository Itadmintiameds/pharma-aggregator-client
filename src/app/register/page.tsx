import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-base-white">
      {/* Header with Back to Home */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 text-warning-500 hover:text-primary-600 transition-colors mx-auto w-fit"
        >
          <ArrowLeft size={20} />
          <span className="text-p3 font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Logo Section - Made Clickable */}
      <div className="max-w-7xl mx-auto px-4 text-center mb-2">
        <Link href="/" className="inline-block">
          <div className="flex justify-center mb-2">
            <Image
              src="/assets/images/tiameds.logo.png"
              alt="TiaMeds"
              width={234}
              height={108}
              priority
              className="object-contain hover:opacity-90 transition-opacity"
            />
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h2 className="text-h3 md:text-h2 font-bold text-neutral-900 mb-1">
            Choose Your Registration Type
          </h2>
          <p className="text-p4 text-neutral-600 max-w-3xl mx-auto">
            Join the future of pharmaceutical trading. Select your role to get started with 
            features tailored for your business needs.
          </p>
        </div>

        {/* Registration Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Buyer Card */}
          <div className="bg-secondary-50 rounded-xlg shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-secondary-100">
            <h3 className="text-h4 font-bold text-primary-800 mb-3">
              Register as Buyer
            </h3>
            <p className="text-p3 font-medium text-primary-600 mb-4">
              Pharmacies, Hospitals, Distributors
            </p>
            
            <ul className="space-y-1 mb-2">
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Access to 10,000+ pharmaceutical products
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                AI-powered demand forecasting
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Bulk ordering with competitive prices
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Smart inventory management
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Prescription verification system
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                24/7 customer support
              </li>
            </ul>

            <div className="mb-4">
              <p className="text-p2 font-semibold text-neutral-800 mb-2">
                Perfect for:
              </p>
              <p className="text-p3 text-neutral-600">
                Retail pharmacies, hospital pharmacies, chain stores, healthcare institutions
              </p>
            </div>

            <Link
              href="/buyer_e8d45a1b"
              className="inline-block w-full bg-primary-900 hover:bg-primary-800 text-white font-semibold text-p3 py-4 px-6 rounded-lg text-center transition-all duration-200 active:scale-[0.98] shadow-md"
            >
              Register as Buyer →
            </Link>
          </div>

          {/* Seller Card */}
          <div className="bg-secondary-50 rounded-xlg shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-secondary-100">
            <h3 className="text-h4 font-bold text-primary-800 mb-3">
              Register as Seller
            </h3>
            <p className="text-p3 font-medium text-primary-600 mb-4">
              Manufacturers, Distributors, Suppliers
            </p>
            
            <ul className="space-y-1 mb-2">
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Zero listing fees for first 1000 products
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                AI-powered market insights
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Global marketplace access
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Quality certification support
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Real-time order management
              </li>
              <li className="flex items-start gap-2 text-p3 text-neutral-700">
                <span className="text-success-500 text-lg">•</span>
                Advanced analytics dashboard
              </li>
            </ul>

            <div className="mb-8">
              <p className="text-p2 font-semibold text-neutral-800 mb-2">
                Perfect for:
              </p>
              <p className="text-p3 text-neutral-600">
                Pharmaceutical manufacturers, API producers, wholesale distributors
              </p>
            </div>

            <Link
              href="/seller_7a3b9f2c"
              className="inline-block w-full bg-primary-900 hover:bg-primary-800 text-white font-semibold text-p3 py-4 px-6 rounded-lg text-center transition-all duration-200 active:scale-[0.98] shadow-md"
            >
              Register as Seller →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}