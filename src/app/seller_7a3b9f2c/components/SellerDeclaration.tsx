'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaArrowRight, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

interface SellerDeclarationProps {
    onAccept: () => void;
    onClose: () => void;
}

const SellerDeclaration: React.FC<SellerDeclarationProps> = ({ onAccept, onClose }) => {
    const [isAccepted, setIsAccepted] = useState(false);
    const [hasSeenBottom, setHasSeenBottom] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const declarations = [
        {
            title: "Authorized Representation & Legal Binding",
            items: [
                "As a condition precedent to Seller Company registration on the TiaMeds Marketplace platform, the following mandatory declarations and acceptances shall be reviewed and accepted either directly by the Seller Company or by an individual duly authorized to act on behalf of the Seller Company.",
                "Any acceptance provided through the TiaMeds Marketplace platform shall be deemed to constitute a legally binding acceptance by the Seller Company.",
                "The Seller Company confirms that the individual completing the registration process is duly authorized to submit information, provide declarations, and accept obligations on behalf of the Seller Company.",
                "Registration of the Seller Company on the TiaMeds Marketplace platform shall not proceed unless the final mandatory acceptance checkbox is acknowledged."
            ]
        },
        {
            title: "Valid License Confirmation",
            items: [
                "The Seller Company confirms that it holds valid, active, and applicable pharmaceutical licenses, approvals, and authorizations required under applicable laws for manufacturing, distribution, stocking, wholesale, retail, or sale of pharmaceutical products.",
                "The Seller Company confirms that all products listed, onboarded, marketed, distributed, or sold through the TiaMeds Marketplace platform fall within the scope of its valid regulatory licenses and approvals.",
                "The Seller Company shall ensure that all licenses remain valid and active throughout its participation on the TiaMeds Marketplace platform.",
                "The Seller Company shall immediately notify TiaMeds Marketplace support team regarding any suspension, cancellation, expiry, restriction, or regulatory action impacting its licenses or operations."
            ]
        },
        {
            title: "Regulatory Compliance Commitment",
            items: [
                "The Seller Company confirms that all products onboarded on the TiaMeds Marketplace platform comply with all applicable laws, regulations, standards, and regulatory requirements, including but not limited to:",
                "• Drugs and Cosmetics Act, 1940",
                "• Drugs and Cosmetics Rules, 1945",
                "• Medical Devices Rules, 2017",
                "• Applicable CDSCO guidelines",
                "• Applicable State FDA regulations",
                "• Any other applicable Central or State laws",
                "The Seller Company accepts sole responsibility for ensuring ongoing regulatory compliance of all products listed or sold through the TiaMeds Marketplace platform."
            ]
        },
        {
            title: "Buyer Eligibility & Controlled Transaction Compliance",
            items: [
                "The Seller Company confirms that pharmaceutical products shall be sold only to legally authorized, verified, and eligible buyers onboarded on the TiaMeds Marketplace platform.",
                "The Seller Company shall ensure compliance with all restrictions applicable to prescription medicines, controlled substances, scheduled drugs, regulated medical products, and jurisdiction-specific sale restrictions.",
                "The Seller Company shall ensure that Schedule H, H1, X, narcotic, psychotropic, temperature-sensitive, or otherwise regulated products are sold strictly in accordance with applicable laws and valid documentation requirements."
            ]
        },
        {
            title: "Prohibited & Restricted Products",
            items: [
                "The Seller Company confirms that it shall not onboard, distribute, advertise, market, or sell any:",
                "• Banned drugs",
                "• Prohibited products",
                "• Spurious products",
                "• Counterfeit products",
                "• Misbranded products",
                "• Adulterated products",
                "• Expired medicines",
                "• Recalled products",
                "• Unauthorized imports",
                "• Products restricted under applicable laws",
                "The registering Seller Company confirms that they will list and sell only those products that are within the scope of their applicable licenses on the TiaMeds Marketplace platform."
            ]
        },
        {
            title: "Product Quality, Safety & Authenticity Responsibility",
            items: [
                "The Seller Company shall remain solely responsible for the quality, safety, efficacy, authenticity, labelling, packaging, storage condition, batch integrity, and regulatory compliance of all products listed on the TiaMeds Marketplace platform.",
                "Any liability arising from sub-standard, defective, adulterated, counterfeit, misbranded, damaged, or non-compliant products shall rest entirely with the Seller Company.",
                "The TiaMeds Marketplace platform will not be responsible for quality verification for products onboarded on the TiaMeds Marketplace platform."
            ]
        },
        {
            title: "Product Information Accuracy & Legal Compliance",
            items: [
                "The registering Seller Company confirms that it is solely responsible for ensuring all product information provided during product onboarding is accurate, complete, and truthful, and that the product listing complies with all applicable laws (as mentioned in point no.3). Any misleading, exaggerated, or false claims are entirely the liability of the registering Seller Company."
            ]
        },
        {
            title: "Pricing, Trade & DPCO Compliance",
            items: [
                "The Seller Company confirms that all product pricing shall comply with:",
                "• Drugs Price Control Order (DPCO), 2013",
                "• National Pharmaceutical Pricing Authority (NPPA) notifications",
                "• Applicable taxation laws",
                "• Applicable trade regulations",
                "• Any other statutory pricing requirements",
                "The Seller Company shall ensure that no overcharging occurs beyond applicable MRP, ceiling price, or statutory limits.",
                "The Seller Company shall remain solely responsible for all pricing decisions, discounts, commercial terms, and pricing compliance obligations.",
                "TiaMeds Marketplace shall not influence or control pharmaceutical pricing decisions between authorized buyers and sellers."
            ]
        },
        {
            title: "Drug Diversion, Abuse & Misuse Prevention",
            items: [
                "The Seller Company shall take appropriate measures to prevent:",
                "• Drug diversion",
                "• Unauthorized resale",
                "• Abuse or misuse of medicines",
                "• Inventory hoarding",
                "• Fraudulent procurement",
                "• Circular trading",
                "• Suspicious ordering patterns",
                "• Unlawful transactions",
                "The Seller Company confirms that products sold through the TiaMeds Marketplace platform shall be used only for lawful medical, institutional, or healthcare purposes. Any unlawful activity, any non-compliance or violation shall be entirely the liability of the registering Seller Company."
            ]
        },
        {
            title: "Storage, Logistics & Cold-Chain Compliance",
            items: [
                "The Seller Company shall remain fully responsible for appropriate:",
                "• Storage",
                "• Warehousing",
                "• Packaging",
                "• Transportation",
                "• Environmental controls",
                "• Cold-chain maintenance",
                "applicable to products sold through the TiaMeds Marketplace platform.",
                "The Seller Company shall ensure preservation of product quality, safety, stability, and integrity throughout logistics and delivery operations.",
                "Any loss, degradation, contamination, spoilage, temperature excursion, or logistics non-compliance shall remain solely the liability of the Seller Company."
            ]
        },
        {
            title: "Product Recall & Market Withdrawal",
            items: [
                "The Seller Company shall immediately initiate product recalls, market withdrawals, quarantine procedures, or regulatory notifications whenever required by:",
                "• CDSCO",
                "• State FDA",
                "• Manufacturers",
                "• Courts",
                "• Other competent authorities",
                "The Seller Company shall remain solely responsible for recall execution, stakeholder communication, investigation support, and regulatory compliance relating to affected products."
            ]
        },
        {
            title: "Order Management, Returns & Pharmacovigilance",
            items: [
                "The Seller Company shall remain solely responsible for management of:",
                "• Order fulfilment",
                "• Cancellations",
                "• Replacements",
                "• Returns",
                "• Refunds",
                "• Reverse logistics",
                "The Seller Company shall comply with all applicable regulatory requirements relating to adverse event reporting, product complaints, quality defects, safety monitoring, and pharmacovigilance obligations.",
                "The Seller Company shall ensure timely reporting in accordance with:",
                "• Drugs and Cosmetics Act, 1940",
                "• Drugs and Cosmetics Rules, 1945",
                "• Pharmacovigilance Programme of India (PvPI) Guidelines",
                "• CDSCO guidelines",
                "• Other applicable laws and regulations",
                "Any lapse, delay, suppression, or non-compliance relating to pharmacovigilance obligations shall remain solely the liability of the Seller Company."
            ]
        },
        {
            title: "Invoicing, Taxation & Financial Compliance",
            items: [
                "The registering Seller Company confirms that it will take full responsibility for issuing invoices in its company name in accordance with below applicable laws:",
                "• Goods and Services Tax (GST) Act, 2017",
                "• Income Tax Act, 1961",
                "• Companies Act, 2013",
                "• State-specific Tax Rules",
                "• Any other statutory regulations",
                "The Seller Company shall maintain complete financial, taxation, and transaction records as required under applicable laws.",
                "Any non-compliance relating to taxation, invoicing, statutory deductions, reporting obligations, or financial irregularities shall remain solely the liability of the Seller Company."
            ]
        },
        {
            title: "Data Protection, Privacy, Audit Trails & Record Retention",
            items: [
                "The Seller Company confirms that all information and documentation submitted to the TiaMeds Marketplace platform shall be accurate, lawful, complete, and up to date.",
                "TiaMeds Marketplace shall maintain reasonable technical, administrative, organizational, and security safeguards to protect platform data in accordance with applicable laws, including the Digital Personal Data Protection (DPDP) Act, 2023.",
                "TiaMeds Marketplace may implement:",
                "• Role-based access controls",
                "• Audit logging",
                "• Encryption mechanisms",
                "• Data monitoring controls",
                "• Secure API integrations",
                "• Compliance monitoring systems",
                "to support platform governance and data protection.",
                "TiaMeds Marketplace shall maintain transaction logs, audit trails, onboarding history, and compliance records to support traceability, investigations, regulatory verification, and dispute resolution.",
                "TiaMeds Marketplace may conduct verification reviews, compliance audits, risk assessments, or due diligence checks relating to Seller Companies and their listed products.",
                "Seller information may be disclosed to regulators, courts, law enforcement agencies, or government authorities whenever legally required."
            ]
        },
        {
            title: "TiaMeds Marketplace Platform Role & Nature",
            items: [
                "TiaMeds Marketplace operates as a technology-enabled pharmaceutical procurement and transaction facilitation platform connecting authorized buyers and sellers.",
                "TiaMeds Marketplace functions as a neutral intermediary platform and does not independently manufacture, distribute, prescribe, recommend, or endorse pharmaceutical products.",
                "TiaMeds Marketplace reserves the right to:",
                "• Suspend Seller accounts",
                "• Block transactions",
                "• Restrict listings",
                "• Remove products",
                "• Freeze platform access",
                "• Initiate investigations",
                "• Support regulatory authorities",
                "• Request additional documentation",
                "whenever required for compliance, risk mitigation, fraud prevention, legal obligations, or regulatory directives.",
                "TiaMeds Marketplace shall always maintain platform availability, except during scheduled maintenance windows and force majeure events, and shall provide Seller Companies with reasonable advance notice of any planned maintenance activities that may impact platform availability.",
                "TiaMeds Marketplace shall maintain appropriate backup, disaster recovery, and system failover mechanisms to support business continuity."
            ]
        },
        {
            title: "Indemnity & Limitation of Liability",
            items: [
                "The Seller Company agrees to fully indemnify, defend, and hold harmless TiaMeds Marketplace, its affiliates, management, employees, technology partners, and representatives against any claims, liabilities, losses, penalties, damages, actions, proceedings, or regulatory consequences arising from:",
                "• Seller activities",
                "• Product-related violations",
                "• Regulatory non-compliance",
                "• Misrepresentation",
                "• Fraudulent conduct",
                "• Intellectual property violations",
                "• Product defects",
                "• Illegal transactions",
                "TiaMeds Marketplace shall not be liable for any obligations, liabilities, losses, or violations arising from the products, actions, omissions, business conduct, or regulatory failures of Seller Companies."
            ]
        }
    ];

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;

            // Once user scrolls to bottom, mark as seen bottom
            if (isAtBottom && !hasSeenBottom) {
                setHasSeenBottom(true);
            }
        }
    };

    useEffect(() => {
        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
            return () => contentElement.removeEventListener('scroll', handleScroll);
        }
    }, [hasSeenBottom]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow checking only if user has seen the bottom at least once
        if (hasSeenBottom) {
            setIsAccepted(e.target.checked);
        }
    };

    const handleContinue = () => {
        if (isAccepted && hasSeenBottom) {
            onAccept();
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">

            {/* Semi-transparent overlay */}
            <div
                className="absolute inset-0 backdrop-blur bg-opacity-10"
                onClick={onClose}
            />

            {/* Modal Container*/}
            <div className="min-h-screen relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden h-[90vh] sm:h-[85vh] flex flex-col mx-2">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 p-1 sm:p-2">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center group shrink-0">
                            <div className="relative h-8 w-24 sm:h-10 sm:w-32 md:h-12 md:w-40">
                                <Image
                                    src="/assets/images/tiameds.logo.png"
                                    alt="TiaMeds Technologies"
                                    fill
                                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-1 sm:p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                        </button>
                    </div>

                    <div >
                        <h1 className="text-base sm:text-xl md:text-2xl lg:text-lg font-bold text-neutral-900 text-center">
                            Seller Company Pre-Registration Mandatory Declarations & Acceptance
                        </h1>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-1 sm:p-2 custom-scrollbar"
                    onScroll={handleScroll}
                >
                    <div className="space-y-4 sm:space-y-6">
                        {declarations.map((declaration, index) => (
                            <div key={index} className="border-l-2 border-primary-200 pl-3 sm:pl-4">
                                <h2 className="text-sm sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">
                                    {index + 1}. {declaration.title}
                                </h2>
                                <ul className="space-y-1 sm:space-y-2">
                                    {declaration.items.map((item, itemIndex) => {
                                        // Check if item starts with bullet (•) for special styling
                                        if (item.startsWith('•')) {
                                            return (
                                                <li key={itemIndex} className="text-neutral-700 text-xs sm:text-sm ml-3 sm:ml-4">
                                                    {item}
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={itemIndex} className="text-neutral-900 text-xs sm:text-sm flex items-start">
                                                <span className="mr-1 sm:mr-2 min-w-0.75 sm:min-w-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}


                    </div>
                </div>

                {/* Fixed Footer with Checkbox */}
                <div className="sticky bottom-0 z-20 bg-white border-t border-neutral-200 p-4 sm:p-6">
                    <div className="flex items-start mb-3 sm:mb-4">
                        <input
                            type="checkbox"
                            id="declaration-acceptance"
                            checked={isAccepted}
                            onChange={handleCheckboxChange}
                            disabled={!hasSeenBottom}
                            className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor="declaration-acceptance"
                            className={`ml-2 sm:ml-3 text-xs sm:text-sm ${hasSeenBottom ? 'text-neutral-900' : 'text-neutral-400'}`}
                        >
                           I hereby confirm that I have read, understood, acknowledged, and accepted all the above declarations, obligations, compliance requirements, operational responsibilities, data protection conditions, audit provisions, and marketplace governance policies applicable to participation on the TiaMeds Marketplace platform. I further understand that any non-compliance may result in suspension, regulatory reporting, investigation, restriction of platform access, or permanent removal from the TiaMeds Marketplace platform.
                        </label>
                    </div>

                    {!hasSeenBottom && (
                        <p className="text-warning-300 text-xs mb-2 sm:mb-4">
                            Please scroll to the bottom of all declarations before you can accept them
                        </p>
                    )}

                    {/* Continue Button - Only shown when checkbox is checked */}
                    {isAccepted && hasSeenBottom && (
                        <button
                            onClick={handleContinue}
                            className="group relative w-full px-4 py-2 sm:px-8 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <span className="flex items-center justify-center">
                                Click here to continue to registration page
                                <FaArrowRight className="ml-2 sm:ml-3 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform" />
                            </span>
                            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        </button>
                    )}

                    {/* Disabled state button when not ready */}
                    {(!isAccepted || !hasSeenBottom) && (
                        <button
                            disabled
                            className="w-full px-4 py-2 sm:px-8 sm:py-3 bg-neutral-200 text-neutral-500 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl cursor-not-allowed"
                        >
                            {hasSeenBottom ? 'Please accept the declarations to continue' : 'Scroll to bottom to enable acceptance'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerDeclaration;
















// old declaration dated 26.05.2026...........


// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { FaArrowRight, FaTimes } from 'react-icons/fa';
// import Image from 'next/image';

// interface SellerDeclarationProps {
//     onAccept: () => void;
//     onClose: () => void;
// }

// const SellerDeclaration: React.FC<SellerDeclarationProps> = ({ onAccept, onClose }) => {
//     const [isAccepted, setIsAccepted] = useState(false);
//     const [hasSeenBottom, setHasSeenBottom] = useState(false);
//     const contentRef = useRef<HTMLDivElement>(null);

//      useEffect(() => {
//         document.body.style.overflow = 'hidden';
//         return () => {
//             document.body.style.overflow = 'unset';
//         };
//     }, []);

//     const declarations = [
//         {
//             title: "Authorized Representation & Legal Binding",
//             items: [
//                 "As a condition precedent to Seller Company registration on the TiaMeds Marketplace platform, the following mandatory declarations & acceptance are displayed for review and acceptance by either the Seller Company directly or by a Registering Individual acting on behalf of, and with due authorization from, the Seller Company.",
//                 "Acceptance provided through the TiaMeds Marketplace platform shall be deemed to be acceptance by and legally binding upon the Seller Company, irrespective of whether such acceptance is provided directly by the Seller Company or by a Registering Individual.",
//                 "Seller Company registration on the TiaMeds Marketplace platform will not be proceeded unless acceptance is provided through the final mandatory acceptance checkbox below."
//             ]
//         },
//         {
//             title: "Valid License Confirmation",
//             items: [
//                 "The registering Seller Company confirms that they hold a valid and active drug manufacturing / wholesale license.",
//                 "The registering Seller Company confirms that their license authorizes the sale of the pharmaceutical products onboarded on the TiaMeds Marketplace platform."
//             ]
//         },
//         {
//             title: "Regulatory Compliance Commitment",
//             items: [
//                 "The registering Seller Company confirms that all products onboarded on the TiaMeds Marketplace platform comply with the Drugs & Cosmetics Act, 1940.",
//                 "The registering Seller Company confirms that all products onboarded on the TiaMeds Marketplace platform comply with the Drugs & Cosmetics Rules, 1945.",
//                 "The registering Seller Company confirms that all products onboarded on the TiaMeds Marketplace platform comply with all applicable Central and State pharmaceutical regulations.",
//                 "The registering Seller Company accepts and retains sole responsibility for regulatory compliance of all products onboarded and sold through the TiaMeds Marketplace platform."
//             ]
//         },
//         {
//             title: "Prohibited & Restricted Products",
//             items: [
//                 "The registering Seller Company confirms that they will not onboard or sell any banned, prohibited, spurious, counterfeit, or adulterated drugs on the TiaMeds Marketplace platform.",
//                 "The registering Seller Company confirms that they will not sell any expired or near-expiry medicines on the TiaMeds Marketplace platform.",
//                 "The registering Seller Company confirms that they will list and sell only those products that are within the scope of their valid drug manufacturing / wholesale license on the TiaMeds Marketplace platform."
//             ]
//         },
//         {
//             title: "Quality, Safety & Authenticity Responsibility",
//             items: [
//                 "The registering Seller Company is solely responsible for quality, safety, and authenticity of the onboarding products. Any sub-standard, misbranded, or spurious liability rests with the registering Seller Company.",
//                 "The TiaMeds Marketplace platform will not be responsible for quality verification for products onboarded on the TiaMeds Marketplace platform."
//             ]
//         },
//         {
//             title: "Product Information Accuracy & Legal Compliance",
//             items: [
//                 "The registering Seller Company confirms that it is solely responsible for ensuring all product information provided during product onboarding is accurate, complete, and truthful, and that the product listing complies with Drugs & Cosmetics Act 1940, Drugs & Cosmetics Rules 1945 and all applicable laws. Any misleading, exaggerated, or false claims are entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Prescription Drug Sale Compliance",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for ensuring that prescription-only drugs (Schedule H, H1, X) are sold only against valid prescriptions provided by the buyers who are legally permitted to purchase them. Any non-compliance or violation shall be entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Pricing & DPCO Compliance",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for ensuring that all drug prices comply with the Drugs Price Control Order (DPCO) 2013, National Pharmaceutical Pricing Authority (NPPA) notifications, and any other applicable laws.",
//                 "The Seller Company ensures that no overcharging occurs beyond the MRP or statutory ceiling price, and that any price revisions are implemented correctly. Any non-compliance or violation shall be entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Drug Diversion & Misuse Prevention",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for ensuring that drugs are not diverted to unauthorized channels through TiaMeds Marketplace platform.",
//                 "The Seller Company ensures that medicines are sold through TiaMeds Marketplace platform are only for legitimate medical treatment and lawful use.",
//                 "The Seller Company shall monitor abnormal ordering patterns to prevent misuse, abuse, resale, or any other unlawful activity and any non-compliance or violation shall be entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Logistics, Storage & Cold-Chain Compliance",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for appropriate storage, packaging, and transportation of all products.",
//                 "The registering Seller Company ensures that cold-chain requirements are maintained where applicable to preserve product quality.",
//                 "Any non-compliance, damage, or lapse in logistics, storage, or cold-chain management shall be entirely the liability of the registering Seller Company, and the TiaMeds Marketplace platform bears no responsibility in this regard."
//             ]
//         },
//         {
//             title: "Product Recall & Market Withdrawal",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for initiating product recalls when directed by regulators (CDSCO / State FDA) or manufacturers.",
//                 "The registering Seller Company ensures that the product recall is executed effectively, including all necessary communication to stakeholders and any non-compliance or lapse shall be entirely its liability."
//             ]
//         },
//         {
//             title: "Order Management & Pharmacovigilance",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for managing order requests, cancellations, replacements, and returns.",
//                 "The Seller Company ensures compliance with all regulator-issued instructions (CDSCO or State FDA) related to product cancellations, replacements and returns.",
//                 "Any non-compliance, lapse, or failure in order management shall be entirely the liability of the registering Seller Company.",
//                 "The registering Seller Company confirms that it will take full responsibility for actively monitoring and reporting adverse events, product quality issues, or any safety concerns in accordance with the below applicable regulations:",
//                 "• Drugs and Cosmetics Act, 1940",
//                 "• Drugs and Cosmetics Rules, 1945",
//                 "• Pharmacovigilance Programme of India (PvPI) Guidelines",
//                 "• Guidelines from CDSCO (Central Drugs Standard Control Organization)",
//                 "• Other applicable Central or State regulations",
//                 "The Seller Company ensures timely and accurate pharmacovigilance reporting.",
//                 "Any non-compliance, lapse, or failure in pharmacovigilance activities shall be entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Invoicing & Tax Compliance",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for issuing invoices in its company name in accordance with below applicable laws:",
//                 "• Goods and Services Tax (GST) Act, 2017",
//                 "• Income Tax Act, 1961",
//                 "• Companies Act, 2013",
//                 "• State-specific Tax Rules",
//                 "• Any other statutory regulations",
//                 "Any non-compliance or violation related to invoicing or tax obligations shall be entirely the liability of the registering Seller Company."
//             ]
//         },
//         {
//             title: "Data Protection, Privacy & Audit Support",
//             items: [
//                 "The registering Seller Company confirms that it will take full responsibility for providing accurate and complete seller company and their product data to the TiaMeds Marketplace platform.",
//                 "The TiaMeds Marketplace platform confirms that it will store and protect seller company and their product data in accordance with the Digital Personal Data Protection (DPDP) Act, 2023, and will maintain reasonable technical and organizational safeguards to preserve confidentiality, integrity, and availability.",
//                 "The TiaMeds Marketplace platform confirms that seller data, including pricing, discounts, margins, and commercial terms, will not be altered, manipulated, misrepresented, or disclosed to competing sellers, except where required by law.",
//                 "The TiaMeds Marketplace platform confirms that seller commercial and product data shall be accessible only to authorized buyers registered on the TiaMeds Marketplace platform, and shall not be used for competitor benchmarking, profiling, or unauthorized commercial, promotional, or analytical purposes.",
//                 "The TiaMeds Marketplace platform confirms that seller company or their product data will not be removed once onboarded by an authorized seller, except where required by law, regulatory orders, or court directions. All such actions will be logged in a secure, tamper-evident audit trail with timestamps, reasons, and references to supporting legal documents to maintain proof of compliance.",
//                 "The TiaMeds Marketplace platform confirms that it may undertake verification and compliance audits of seller company and their product data as part of regulatory due diligence to prevent misuse, fraud, or non-compliance.",
//                 "The TiaMeds Marketplace platform confirms that seller information may be shared with authorities when legally required.",
//                 "Any non-compliance, lapse, or misuse of seller data shall be entirely the liability of the respective party responsible — the Seller Company for data accuracy, and TiaMeds Marketplace platform for data protection, access, and compliance safeguards."
//             ]
//         },
//         {
//             title: "TiaMeds Marketplace Platform Role & Nature",
//             items: [
//                 "The TiaMeds Marketplace platform confirms that it functions solely as a technology intermediary and facilitator.",
//                 "The TiaMeds Marketplace platform enables trade and transaction facilitation between authorized onboarded buyers and sellers on the TiaMeds Marketplace platform, without directly participating in the sale of products.",
//                 "The TiaMeds Marketplace platform does not promote, advertise, endorse, or recommend any pharmaceutical products.",
//                 "The TiaMeds Marketplace platform does not influence pricing, demand, or purchasing decisions.",
//                 "The authorized onboarded Sellers and buyers on TiaMeds Marketplace platform bear sole responsibility for trade decisions and transactional outcomes.",
//                 "The TiaMeds Marketplace platform does not guarantee uninterrupted TiaMeds Marketplace platform availability and shall not be held liable for losses arising from system downtime, connectivity failures, technical issues, or force majeure events."
//             ]
//         },
//         {
//             title: "Indemnity & Liability",
//             items: [
//                 "The registering Seller Company confirms that it will fully indemnify and hold harmless the TiaMeds Marketplace platform against any claims, losses, fines, penalties, or legal actions arising from the Seller Company's actions, by their products, or regulatory violations.",
//                 "The TiaMeds Marketplace platform confirms that it will not be liable for any violations, non-compliance, or legal obligations arising from the Seller Company's actions or by their products."
//             ]
//         }
//     ];

//     const handleScroll = () => {
//         if (contentRef.current) {
//             const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
//             const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;

//             // Once user scrolls to bottom, mark as seen bottom
//             if (isAtBottom && !hasSeenBottom) {
//                 setHasSeenBottom(true);
//             }
//         }
//     };

//     useEffect(() => {
//         const contentElement = contentRef.current;
//         if (contentElement) {
//             contentElement.addEventListener('scroll', handleScroll);
//             return () => contentElement.removeEventListener('scroll', handleScroll);
//         }
//     }, [hasSeenBottom]);

//     const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         // Allow checking only if user has seen the bottom at least once
//         if (hasSeenBottom) {
//             setIsAccepted(e.target.checked);
//         }
//     };

//     const handleContinue = () => {
//         if (isAccepted && hasSeenBottom) {
//             onAccept();
//         }
//     };


//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">

//             {/* Semi-transparent overlay */}
//             <div
//                 className="absolute inset-0 backdrop-blur bg-opacity-10"
//                 onClick={onClose}
//             />

//             {/* Modal Container*/}
//             <div className="min-h-screen relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden h-[90vh] sm:h-[85vh] flex flex-col mx-2">
//                 {/* Header */}
//                 <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 p-1 sm:p-2">
//                     <div className="flex items-center justify-between">
//                         {/* Logo */}
//                         <div className="flex items-center group shrink-0">
//                             <div className="relative h-8 w-24 sm:h-10 sm:w-32 md:h-12 md:w-40">
//                                 <Image
//                                     src="/assets/images/tiameds.logo.png"
//                                     alt="TiaMeds Technologies"
//                                     fill
//                                     className="object-contain transition-transform duration-300 group-hover:scale-105"
//                                     priority
//                                 />
//                             </div>
//                         </div>

//                         {/* Close Button */}
//                         <button
//                             onClick={onClose}
//                             className="p-1 sm:p-2 hover:bg-neutral-100 rounded-full transition-colors"
//                         >
//                             <FaTimes className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
//                         </button>
//                     </div>

//                     <div >
//                         <h1 className="text-base sm:text-xl md:text-2xl lg:text-lg font-bold text-neutral-900 text-center">
//                             Seller Company Pre-Registration Mandatory Declarations & Acceptance
//                         </h1>
//                     </div>
//                 </div>

//                 {/* Scrollable Content */}
//                 <div
//                     ref={contentRef}
//                     className="flex-1 overflow-y-auto p-1 sm:p-2 custom-scrollbar"
//                     onScroll={handleScroll}
//                 >
//                     <div className="space-y-4 sm:space-y-6">
//                         {declarations.map((declaration, index) => (
//                             <div key={index} className="border-l-2 border-primary-200 pl-3 sm:pl-4">
//                                 <h2 className="text-sm sm:text-base font-bold text-neutral-900 mb-1 sm:mb-2">
//                                     {index + 1}. {declaration.title}
//                                 </h2>
//                                 <ul className="space-y-1 sm:space-y-2">
//                                     {declaration.items.map((item, itemIndex) => {
//                                         // Check if item starts with bullet (•) for special styling
//                                         if (item.startsWith('•')) {
//                                             return (
//                                                 <li key={itemIndex} className="text-neutral-700 text-xs sm:text-sm ml-3 sm:ml-4">
//                                                     {item}
//                                                 </li>
//                                             );
//                                         }
//                                         return (
//                                             <li key={itemIndex} className="text-neutral-900 text-xs sm:text-sm flex items-start">
//                                                 <span className="mr-1 sm:mr-2 min-w-0.75 sm:min-w-1">•</span>
//                                                 <span>{item}</span>
//                                             </li>
//                                         );
//                                     })}
//                                 </ul>
//                             </div>
//                         ))}


//                     </div>
//                 </div>

//                 {/* Fixed Footer with Checkbox */}
//                 <div className="sticky bottom-0 z-20 bg-white border-t border-neutral-200 p-4 sm:p-6">
//                     <div className="flex items-start mb-3 sm:mb-4">
//                         <input
//                             type="checkbox"
//                             id="declaration-acceptance"
//                             checked={isAccepted}
//                             onChange={handleCheckboxChange}
//                             disabled={!hasSeenBottom}
//                             className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                         />
//                         <label
//                             htmlFor="declaration-acceptance"
//                             className={`ml-2 sm:ml-3 text-xs sm:text-sm ${hasSeenBottom ? 'text-neutral-900' : 'text-neutral-400'}`}
//                         >
//                             I have read, understood, and accept all the above mandatory declarations to ensure regulatory compliance, data protection, and trusted participation on the TiaMeds Marketplace platform.
//                         </label>
//                     </div>

//                     {!hasSeenBottom && (
//                         <p className="text-warning-300 text-xs mb-2 sm:mb-4">
//                             Please scroll to the bottom of all declarations before you can accept them
//                         </p>
//                     )}

//                     {/* Continue Button - Only shown when checkbox is checked */}
//                     {isAccepted && hasSeenBottom && (
//                         <button
//                             onClick={handleContinue}
//                             className="group relative w-full px-4 py-2 sm:px-8 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
//                         >
//                             <span className="flex items-center justify-center">
//                                 Click here to continue to registration page
//                                 <FaArrowRight className="ml-2 sm:ml-3 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform" />
//                             </span>
//                             <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                         </button>
//                     )}

//                     {/* Disabled state button when not ready */}
//                     {(!isAccepted || !hasSeenBottom) && (
//                         <button
//                             disabled
//                             className="w-full px-4 py-2 sm:px-8 sm:py-3 bg-neutral-200 text-neutral-500 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl cursor-not-allowed"
//                         >
//                             {hasSeenBottom ? 'Please accept the declarations to continue' : 'Scroll to bottom to enable acceptance'}
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SellerDeclaration;