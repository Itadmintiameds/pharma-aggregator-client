"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";

const LandingHeader = () => {
    return (
        <header className="w-full bg-base-white fixed top-0 left-0 z-50">

            {/* ================= ROW 1 ================= */}
            <div className="w-full h-16 px-[40px] py-[8px] flex items-center gap-4 bg-base-white">
                <div className="max-w-full w-full h-12 mx-auto flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="relative w-[121px] h-[56px]">
                        <Image
                            src="/assets/images/tiameds.logo.png"
                            alt="TiaMeds"
                            fill
                            className="object-contain"
                            priority
                        />
                    </Link>

                    {/* Right Navigation */}
                    <div className="w-[428px] h-10 flex items-center gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <Button
                                key={item}
                                variant="text"
                                size="sm"
                                shape="round"
                                label="Home"
                                icon={
                                    <Image
                                        src="/icons/home.svg"
                                        alt="Home"
                                        width={16}
                                        height={16}
                                    />
                                }
                                iconPosition="left"
                                className="w-[95px]"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= ROW 2 ================= */}
            <div className="w-full h-16 px-[40px] py-[8px] flex items-center gap-6 border-b border-neutral-100 bg-base-white">
                <div className="max-w-full w-full mx-auto flex items-center justify-between">

                    {/* Search */}
                    <div className="relative w-[662px] h-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />

                        <input
                            type="text"
                            placeholder="Search by molecule, Brand or therapeutic area"
                            className="w-full h-full pl-12 pr-4 rounded-md bg-neutral-100 text-label-l3 focus:outline-none"
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="h-12 flex items-center gap-2">

                        <Link href="/buyer_e8d45a1b">
                            <Button
                                variant="outline"
                                size="md"
                                shape="round"
                                label="Become a Buyer"
                                className="w-[155px]"
                            />
                        </Link>
                        <Link href="/seller_7a3b9f2c">
                            <Button
                                variant="outline"
                                size="md"
                                shape="round"
                                label="Become a Seller"
                                className="w-[155px]"
                            />
                        </Link>

                        <Link href="/admin_f6c29e3d">
                            <Button
                                variant="outline"
                                size="md"
                                shape="round"
                                label=""
                               icon={
                                      <svg
                                          width="20"
                                          height="20"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          className="fill-current"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                               fillRule="evenodd"
                                               clipRule="evenodd"
                                               d="M1.5 3C1.5 2.58579 1.83579 2.25 2.25 2.25H3.636C4.48684 2.25 5.22782 2.8223 5.44738 3.64065L5.4477 3.64185L5.6787 4.50855C11.1204 4.40918 16.5517 5.04014 21.8273 6.38525C22.0294 6.43678 22.2009 6.57016 22.3007 6.75335C22.4004 6.93654 22.4194 7.153 22.353 7.35073C21.5186 9.83571 20.5273 12.2497 19.3922 14.5786C19.2665 14.8364 19.0048 15 18.718 15H7.5C6.90326 15 6.33097 15.2371 5.90901 15.659C5.66946 15.8986 5.4895 16.1866 5.37868 16.5H20.25C20.6642 16.5 21 16.8358 21 17.25C21 17.6642 20.6642 18 20.25 18H4.5C4.08579 18 3.75 17.6642 3.75 17.25C3.75 16.2554 4.14509 15.3016 4.84835 14.5983C5.32444 14.1223 5.91535 13.7874 6.556 13.6208L3.99862 4.02935C3.95404 3.86392 3.80502 3.75 3.636 3.75H2.25C1.83579 3.75 1.5 3.41421 1.5 3ZM8.07622 13.5H18.2471C19.1537 11.6018 19.9627 9.64683 20.6666 7.64305C15.8898 6.49465 10.9892 5.94369 6.07705 6.00269L8.07622 13.5ZM4.18934 19.1893C4.47065 18.908 4.85218 18.75 5.25 18.75C5.64782 18.75 6.02935 18.908 6.31066 19.1893C6.59197 19.4706 6.75 19.8522 6.75 20.25C6.75 20.6478 6.59197 21.0294 6.31066 21.3107C6.02935 21.592 5.64782 21.75 5.25 21.75C4.85218 21.75 4.47065 21.592 4.18934 21.3107C3.90803 21.0294 3.75 20.6478 3.75 20.25C3.75 19.8522 3.90803 19.4706 4.18934 19.1893ZM16.9393 19.1893C17.2206 18.908 17.6022 18.75 18 18.75C18.3978 18.75 18.7794 18.908 19.0607 19.1893C19.342 19.4706 19.5 19.8522 19.5 20.25C19.5 20.6478 19.342 21.0294 19.0607 21.3107C18.7794 21.592 18.3978 21.75 18 21.75C17.6022 21.75 17.2206 21.592 16.9393 21.3107C16.658 21.0294 16.5 20.6478 16.5 20.25C16.5 19.8522 16.658 19.4706 16.9393 19.1893Z"
                                               fill="currentColor"
                                            />
                                        </svg>
                                    }
                            />

                        </Link>
                    </div>
                </div>
            </div>

        </header>
    );
}

export default LandingHeader;
























// This header is without new global css and also without figma design...............

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import AdminLogin from "../AdminLogin";
// import { FiMenu, FiX } from "react-icons/fi";
// import { FaUser, FaStore, FaShoppingCart, FaSignInAlt } from "react-icons/fa";

// export default function LandingHeader() {
//     const [menuOpen, setMenuOpen] = useState(false);
//     const [showAdminLogin, setShowAdminLogin] = useState(false);

//     const navItems = [
//         { name: "Home", href: "/" },
//         { name: "About", href: "/about" },
//     ];

//     return (
//         <>
//             {/* Header */}
//             <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-neutral-200 shadow-sm">
//                 <div className="mx-auto px-4 sm:px-6">
//                     <div className="flex items-center justify-between h-20">
//                         {/* Logo */}
//                         <Link href="/" className="flex items-center group shrink-0">
//                             <div className="relative h-14 w-48 sm:h-16 sm:w-56 lg:h-18 lg:w-64">
//                                 <Image
//                                     src="/assets/images/tiameds.logo.png"
//                                     alt="TiaMeds Technologies"
//                                     fill
//                                     className="object-contain transition-transform duration-300 group-hover:scale-105"
//                                     priority
//                                 />
//                             </div>
//                         </Link>

//                         {/* Desktop Navigation - Right side */}
//                         <nav className="hidden lg:flex items-center space-x-6 ml-auto mr-6">
//                             {navItems.map((item) => (
//                                 <Link
//                                     key={item.name}
//                                     href={item.href}
//                                     className="px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200 relative group"
//                                 >
//                                     {item.name}
//                                     <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
//                                 </Link>
//                             ))}
//                         </nav>

//                         {/* Desktop CTA Buttons - Right */}
//                         <div className="hidden lg:flex items-center space-x-3">
//                             {/* Login Button */}
//                             <button
//                                 onClick={() => setShowAdminLogin(true)}
//                                 className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
//                             >
//                                 <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
//                                     <FaSignInAlt className="mr-2" />
//                                     Login
//                                 </span>
//                                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                             </button>

//                             {/* Seller Button */}
//                             <Link
//                                 href="/seller_7a3b9f2c"
//                                 className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
//                             >
//                                 <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
//                                     <FaStore className="mr-2" />
//                                     Become a Seller
//                                 </span>
//                                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                             </Link>

//                             {/* Buyer Button */}
//                             <Link
//                                 href="/buyer_e8d45a1b"
//                                 className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
//                             >
//                                 <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
//                                     <FaShoppingCart className="mr-2" />
//                                     Become a Buyer
//                                 </span>
//                                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                             </Link>

//                             {/* Admin Login Button */}
//                             {/* <button
//                                 onClick={() => setShowAdminLogin(true)}
//                                 className="group relative px-4 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
//                             >
//                                 <span className="flex items-center text-primary-600 group-hover:text-white font-medium text-sm">
//                                     <FaUser className="mr-2" />
//                                     Login As Admin
//                                 </span>
//                                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                             </button> */}
//                         </div>

//                         {/* Mobile Menu Button */}
//                         <button
//                             onClick={() => setMenuOpen(true)}
//                             className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
//                             aria-label="Open menu"
//                         >
//                             <FiMenu className="w-6 h-6 text-neutral-700" />
//                         </button>
//                     </div>
//                 </div>
//             </header>

//             {/* Spacer for fixed header */}
//             <div className="h-16"></div>

//             {/* Admin Login Modal */}
//             {showAdminLogin && (
//                 <AdminLogin onClose={() => setShowAdminLogin(false)} />
//             )}

//             {/* Mobile Menu Overlay */}
//             {menuOpen && (
//                 <div
//                     className="fixed inset-0 bg-black/40 z-40 lg:hidden"
//                     onClick={() => setMenuOpen(false)}
//                 />
//             )}

//             {/* Mobile Side Drawer */}
//             <div
//                 className={`fixed top-0 right-0 h-screen w-72 bg-white z-50 transform transition-transform duration-300 ease-out lg:hidden ${
//                     menuOpen ? "translate-x-0" : "translate-x-full"
//                 } shadow-xl`}
//             >
//                 {/* Drawer Header */}
//                 <div className="flex items-center justify-between p-4 border-b border-neutral-100">
//                     <div className="h-8 w-32 relative">
//                         <Image
//                             src="/assets/images/tiameds.logo.png"
//                             alt="TiaMeds"
//                             fill
//                             className="object-contain"
//                         />
//                     </div>
//                     <button
//                         onClick={() => setMenuOpen(false)}
//                         className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
//                         aria-label="Close menu"
//                     >
//                         <FiX className="w-5 h-5 text-neutral-700" />
//                     </button>
//                 </div>

//                 {/* Mobile Navigation */}
//                 <div className="p-4">
//                     <nav className="space-y-1 mb-8">
//                         {navItems.map((item) => (
//                             <Link
//                                 key={item.name}
//                                 href={item.href}
//                                 onClick={() => setMenuOpen(false)}
//                                 className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
//                             >
//                                 {item.name}
//                             </Link>
//                         ))}
//                     </nav>

//                     {/* Mobile CTA Buttons */}
//                     <div className="space-y-3">
//                         <button
//                             onClick={() => {
//                                 setMenuOpen(false);
//                                 setShowAdminLogin(true);
//                             }}
//                             className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
//                         >
//                             <FaSignInAlt className="mr-2" />
//                             Login
//                         </button>

//                         <Link
//                             href="/seller_7a3b9f2c"
//                             onClick={() => setMenuOpen(false)}
//                             className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
//                         >
//                             <FaStore className="mr-2" />
//                             Become a Seller
//                         </Link>

//                         <Link
//                             href="/buyer_e8d45a1b"
//                             onClick={() => setMenuOpen(false)}
//                             className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
//                         >
//                             <FaShoppingCart className="mr-2" />
//                             Become a Buyer
//                         </Link>

//                         <button
//                             onClick={() => {
//                                 setMenuOpen(false);
//                                 setShowAdminLogin(true);
//                             }}
//                             className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
//                         >
//                             <FaUser className="mr-2" />
//                             Admin Login
//                         </button>
//                     </div>

//                     {/* Footer in Mobile Menu */}
//                     <div className="mt-8 pt-6 border-t border-neutral-100">
//                         <p className="text-neutral-500 text-sm text-center px-2">
//                             Transforming healthcare through innovative technology
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }