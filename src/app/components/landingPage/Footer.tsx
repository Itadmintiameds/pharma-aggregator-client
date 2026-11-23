'use client'
import Image from "next/image";
import Link from "next/link";
import { FaEnvelope, FaMapMarkerAlt, FaHeadset } from 'react-icons/fa'

const COMPANY_LINKS = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Careers', href: '/careers' },
];

const SOLUTION_LINKS = [
  { name: 'Pharma E-Commerce Platform', href: '/solutions/ecommerce' },
  { name: 'Lab Management Software', href: '/solutions/lab' },
  { name: 'Pharmacy Management', href: '/solutions/pharmacy' },
];

const POLICY_LINKS = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookies' },
];

function LinkColumn({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-secondary-200">{title}</h3>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-[15px] text-neutral-100 transition-colors hover:text-white hover:underline hover:underline-offset-4"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-secondary-200">
        {icon}
      </span>
      <div className="min-w-0 text-[15px] leading-relaxed text-neutral-100">{children}</div>
    </li>
  );
}

const Footer = () => {
  return (
    <footer className="bg-primary-900 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl pt-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block" aria-label="TiaMeds home">
              <Image
                alt="TiaMeds Technologies Logo"
                src="/assets/images/tiamLogo.jpg"
                className="h-16 w-auto rounded-xl"
                width={169}
                height={104}
                priority
              />
            </Link>
            <p className="mt-5 max-w-[22rem] text-[15px] leading-relaxed text-neutral-100">
              Transforming pharmaceutical B2B trading with AI-powered technology.
            </p>
          </div>

          <div className="lg:col-span-2">
            <LinkColumn title="Company" links={COMPANY_LINKS} />
          </div>

          <div className="lg:col-span-3">
            <LinkColumn title="Solutions" links={SOLUTION_LINKS} />
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-secondary-200">Contact</h3>
            <address className="not-italic">
              <ul className="space-y-4">
                <ContactItem icon={<FaMapMarkerAlt className="h-4 w-4" />}>
                  No. 59, 2nd Floor of Dakshina Murthy Towers, Devanooru, Rajeevnagara 2nd Stage, Udayagiri, Mysore,
                  Karnataka – 570019
                </ContactItem>
                <ContactItem icon={<FaHeadset className="h-4 w-4" />}>
                  <Link href="/contact" className="font-medium hover:text-white hover:underline hover:underline-offset-4">
                    Help Center
                  </Link>
                </ContactItem>
                <ContactItem icon={<FaEnvelope className="h-4 w-4" />}>
                  <Link
                    href="mailto:support@tiameds.ai"
                    className="break-all hover:text-white hover:underline hover:underline-offset-4"
                  >
                    support@tiameds.ai
                  </Link>
                </ContactItem>
              </ul>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 py-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-neutral-200">
              © {new Date().getFullYear()} TiaMeds E-Commerce Pvt. Ltd. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-neutral-300">Empowering healthcare through technology innovation</p>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {POLICY_LINKS.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="text-sm text-neutral-200 transition-colors hover:text-white">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer;

// 'use client'
// import { motion } from 'framer-motion';
// // import Image from "next/image";
// import Link from "next/link";
// import {
//   FaEnvelope,
//   FaMapMarkerAlt,
//   FaPhone
// } from 'react-icons/fa'

// const Footer = () => {
//   return (
//     <footer className="relative bg-neutral-900 py-2 px-6 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         {/* Main Footer Content */}
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
//           {/* Company Info - Takes 4 columns */}
//           <div className="md:col-span-4 space-y-8">
//             {/* <Link href="/" className="flex items-center">
//               <Image
//                 alt="TiaMeds Technologies Logo"
//                 src="/assets/images/tiameds.logo.png"
//                 className="h-16 w-auto"
//                 width={160}
//                 height={64}
//                 priority
//               />
//             </Link> */}
            
//             <p className="text-white text-lg leading-relaxed max-w-md">
//               Transforming pharmaceutical B2B trading with AI-powered technology.
//             </p>
            
//           </div>

//           {/* Navigation & Contact - Takes 8 columns */}
//           <div className="md:col-span-8">
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
//               {/* Quick Links */}
//               <div>
//                 <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
//                   Company
//                 </h3>
//                 <ul className="space-y-4">
//                   {[
//                     { name: 'About Us', href: '/about' },
//                     { name: 'Contact Us', href: '/contact' },
//                     { name: 'Careers', href: '/careers' }
//                   ].map((item) => (
//                     <li key={item.name}>
//                       <motion.div whileHover={{ x: 5 }}>
//                         <Link
//                           href={item.href}
//                           className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 flex items-center group"
//                         >
//                           <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 mr-3 transition-opacity"></span>
//                           {item.name}
//                         </Link>
//                       </motion.div>
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Solutions */}
//               <div>
//                 <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
//                   Solutions
//                 </h3>
//                 <ul className="space-y-4">
//                   {[
//                     { name: 'Pharma E-Commerce Platform', href: '/solutions/ecommerce' },
//                     { name: 'Lab Management Software', href: '/solutions/lab' },
//                     { name: 'Pharmacy Management', href: '/solutions/pharmacy' }
//                   ].map((item) => (
//                     <li key={item.name}>
//                       <motion.div whileHover={{ x: 5 }}>
//                         <Link
//                           href={item.href}
//                           className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 flex items-center group"
//                         >
//                           <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 mr-3 transition-opacity"></span>
//                           {item.name}
//                         </Link>
//                       </motion.div>
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Contact Info */}
//               <div>
//                 <h3 className="text-white text-xl font-semibold mb-6 pb-2 border-b border-neutral-800">
//                   Contact
//                 </h3>
//                 <address className="not-italic space-y-6">
//                   <div className="flex items-start">
//                     <div className="shrink-0 mt-1 mr-4">
//                       <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
//                         <FaMapMarkerAlt className="w-4 h-4 text-primary-400" />
//                       </div>
//                     </div>
//                     <div>
//                       <p className="text-neutral-400 text-sm leading-relaxed hover:text-primary-400 transition-colors">
//                         No. 59, 2nd Floor of Dakshina Murthy Towers, Devanooru,<br />
//                          Rajeevnagara 2nd Stage<br />
//                         Udayagiri, Mysore<br />
//                         Karnataka – 570019
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-center">
//                     <div className="shrink-0 mr-4">
//                       <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
//                         <FaPhone className="w-4 h-4 text-primary-400" />
//                       </div>
//                     </div>
//                     <div
//                       className="text-neutral-400 hover:text-primary-400 transition-colors text-lg font-medium"
//                     >
//                       Help Center
//                     </div>
//                   </div>

//                   <div className="flex items-center">
//                     <div className="shrink-0 mr-4">
//                       <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
//                         <FaEnvelope className="w-4 h-4 text-primary-400" />
//                       </div>
//                     </div>
//                     <Link
//                       href="mailto:support@tiameds.ai"
//                       className="text-neutral-400 hover:text-primary-400 transition-colors"
//                     >
//                       support@tiameds.ai
//                     </Link>
//                   </div>
//                 </address>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom Bar */}
//         <div className="mt-2 pt-2 border-t border-neutral-900">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
//             {/* Copyright */}
//             <div className="text-center md:text-left">
//               <p className="text-neutral-500 text-sm">
//                 © {new Date().getFullYear()} TiaMeds E-Commerce Pvt. Ltd. All rights reserved.
//               </p>
//               <p className="text-neutral-600 text-xs mt-1">
//                 Empowering healthcare through technology innovation
//               </p>
//             </div>

//             {/* Policy Links */}
//             <div className="flex items-center space-x-8">
//               <Link
//                 href="/privacy"
//                 className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
//               >
//                 Privacy Policy
//               </Link>
//               <Link
//                 href="/terms"
//                 className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
//               >
//                 Terms of Service
//               </Link>
//               <Link
//                 href="/cookies"
//                 className="text-neutral-500 hover:text-primary-400 transition-colors text-sm"
//               >
//                 Cookie Policy
//               </Link>
//             </div>
//           </div>

//           {/* Certification Badge */}
//           <div className="mt-2 flex justify-center">
//             <div className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800">
//               <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse mr-2"></span>
//               <span className="text-neutral-500 text-xs">
//                 ISO 27001 Certified • HIPAA Compliant
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   )
// }

// export default Footer;