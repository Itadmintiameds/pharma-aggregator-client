'use client'
import { motion } from 'framer-motion';
// import Image from "next/image";
import Link from "next/link";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone
} from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="relative bg-neutral-900 py-2 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Company Info - Takes 4 columns */}
          <div className="md:col-span-4 space-y-8">
            {/* <Link href="/" className="flex items-center">
              <Image
                alt="TiaMeds Technologies Logo"
                src="/assets/images/tiameds.logo.png"
                className="h-16 w-auto"
                width={160}
                height={64}
                priority
              />
            </Link> */}
            
            <p className="text-white text-lg leading-relaxed max-w-md">
              Transforming pharmaceutical B2B trading with AI-powered technology.
            </p>
            
          </div>

          {/* Navigation & Contact - Takes 8 columns */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {/* Quick Links */}
              <div>
                <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
                  Company
                </h3>
                <ul className="space-y-4">
                  {[
                    { name: 'About Us', href: '/about' },
                    { name: 'Contact Us', href: '/contact' },
                    { name: 'Careers', href: '/careers' }
                  ].map((item) => (
                    <li key={item.name}>
                      <motion.div whileHover={{ x: 5 }}>
                        <Link
                          href={item.href}
                          className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 mr-3 transition-opacity"></span>
                          {item.name}
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
                  Solutions
                </h3>
                <ul className="space-y-4">
                  {[
                    { name: 'Pharma E-Commerce Platform', href: '/solutions/ecommerce' },
                    { name: 'Lab Management Software', href: '/solutions/lab' },
                    { name: 'Pharmacy Management', href: '/solutions/pharmacy' }
                  ].map((item) => (
                    <li key={item.name}>
                      <motion.div whileHover={{ x: 5 }}>
                        <Link
                          href={item.href}
                          className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 mr-3 transition-opacity"></span>
                          {item.name}
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
                  Contact
                </h3>
                <address className="not-italic space-y-6">
                  <div className="flex items-start">
                    <div className="shrink-0 mt-1 mr-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                        <FaMapMarkerAlt className="w-4 h-4 text-primary-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm leading-relaxed hover:text-primary-400 transition-colors">
                        No. 59, 2nd Floor of Dakshina Murthy Towers, Devanooru,<br />
                         Rajeevnagara 2nd Stage<br />
                        Udayagiri, Mysore<br />
                        Karnataka – 570019
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                        <FaPhone className="w-4 h-4 text-primary-400" />
                      </div>
                    </div>
                    <div
                      className="text-neutral-400 hover:text-primary-400 transition-colors text-lg font-medium"
                    >
                      Help Center
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                        <FaEnvelope className="w-4 h-4 text-primary-400" />
                      </div>
                    </div>
                    <Link
                      href="mailto:support@tiameds.ai"
                      className="text-neutral-400 hover:text-primary-400 transition-colors"
                    >
                      support@tiameds.ai
                    </Link>
                  </div>
                </address>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-2 pt-2 border-t border-neutral-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-neutral-500 text-sm">
                © {new Date().getFullYear()} TiaMeds E-Commerce Pvt. Ltd. All rights reserved.
              </p>
              <p className="text-neutral-600 text-xs mt-1">
                Empowering healthcare through technology innovation
              </p>
            </div>

            {/* Policy Links */}
            <div className="flex items-center space-x-8">
              <Link
                href="/privacy"
                className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Certification Badge */}
          <div className="mt-2 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse mr-2"></span>
              <span className="text-neutral-500 text-xs">
                ISO 27001 Certified • HIPAA Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;