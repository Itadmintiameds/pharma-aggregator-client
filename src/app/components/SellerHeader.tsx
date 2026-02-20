"use client";
import Link from 'next/link';
import { useRouter } from "next/navigation";


export default function SellerHeader() {
    const router = useRouter();
    return (
        <div className="bg-[#F3ECF8] pb-6">
            <header
                className="
                    fixed top-0 left-0 z-50
                    w-full
                    border border-[#eaeaea]
                    bg-[#f4f2f7]
                    shadow-[0_0_12px_rgba(0,0,0,0.10)]
                "
            >
                <div className="flex items-center justify-between px-6">
                    {/* Logo */}
                    <Link href={"/"}>
                        <div className="flex items-center">
                            <img
                                src="/assets/images/tiameds.logo.png"
                                alt="Company logo"
                                width={230}
                                height={40}
                                className="transition-transform duration-200 hover:scale-110"
                            />
                        </div>
                    </Link>

                    
                            <div className="text-center flex-grow-1 mt-3">
                                <h2 className="phsr-gradient-text-sm mb-1  text-[#9A6AFF] text-[18px] font-semibold">
                                    Seller Registration    
                                </h2>
                            </div>
                       

                    {/* Actions */}
                    <nav className="flex items-center gap-20 font-sans text-base font-medium text-[#0A0A0B] pr-20">

                        
                            <>
                                
{/* Logout */}
<Link
  href="/"
  className="
    flex items-center gap-2
    text-[18px] font-semibold text-[#2D0066]
    transition-all duration-200
    hover:text-[#751bb5]
    hover:scale-90
    hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
  "
>
  <i className="bi bi-box-arrow-right text-[20px]"></i>
  Log Out    
</Link>

                                
                            </>
                      

                    </nav>

                </div>
            </header>
        </div>
    )
}
