'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FaFire,
    FaClock,
    FaTag,
    FaShoppingCart,
    FaChevronRight,
    FaStar,
    FaTruck,
    FaHeart
} from 'react-icons/fa';
import Image from 'next/image';

const Deals = () => {
    const [wishlist, setWishlist] = useState<string[]>([])
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    // Calculate time until midnight
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const midnight = new Date()
            midnight.setHours(24, 0, 0, 0) // Set to next midnight

            const difference = midnight.getTime() - now.getTime()

            if (difference > 0) {
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)

                setTimeLeft({ hours, minutes, seconds })
            } else {
                // If midnight has passed, set to next day's midnight
                midnight.setDate(midnight.getDate() + 1)
                const newDifference = midnight.getTime() - now.getTime()
                const hours = Math.floor((newDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((newDifference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((newDifference % (1000 * 60)) / 1000)

                setTimeLeft({ hours, minutes, seconds })
            }
        }

        // Calculate immediately
        calculateTimeLeft()

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000)

        // Cleanup
        return () => clearInterval(timer)
    }, [])

    const formatTime = (time: number) => {
        return time.toString().padStart(2, '0')
    }

    const deals = [
        {
            id: 1,
            name: "Bayer Aspirin",
            brand: "Bayer",
            description: "Low Dose 81mg, Enteric Coated",
            image: "/assets/images/bayer.jpg",
            price: "₹145",
            originalPrice: "₹180",
            discount: "20% OFF",
            rating: 4.7,
            reviews: "1.2k",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Cardiovascular"
        },
        {
            id: 2,
            name: "Cetirizine Tablets",
            brand: "CT3W0Y Pharma",
            description: "10mg, Antihistamine, Pack of 10",
            image: "/assets/images/cetirizine-CT3W0Y.jpg",
            price: "₹65",
            originalPrice: "₹85",
            discount: "24% OFF",
            rating: 4.5,
            reviews: "890",
            delivery: "FREE Delivery",
            stock: "Limited stock",
            category: "Allergy"
        },
        {
            id: 3,
            name: "Cholecalciferol D3",
            brand: "Sun Pharma",
            description: "Vitamin D3 60K IU, 4 Tablets",
            image: "/assets/images/cholecalciferol.jpg",
            price: "₹220",
            originalPrice: "₹280",
            discount: "21% OFF",
            rating: 4.8,
            reviews: "2.3k",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Vitamins"
        },
        {
            id: 4,
            name: "Concerta ER",
            brand: "Janssen",
            description: "Methylphenidate 18mg, Extended Release",
            image: "/assets/images/concerta.jpg",
            price: "₹1,850",
            originalPrice: "₹2,300",
            discount: "20% OFF",
            rating: 4.6,
            reviews: "450",
            delivery: "Express Delivery",
            stock: "Moderate stock",
            category: "Neurology"
        },
        {
            id: 5,
            name: "Crocin Advance",
            brand: "GSK",
            description: "650mg Tablets, Pack of 15",
            image: "/assets/images/crocin-advance-tablets.jpg",
            price: "₹95",
            originalPrice: "₹120",
            discount: "21% OFF",
            rating: 4.9,
            reviews: "3.1k",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Analgesic"
        },
        {
            id: 6,
            name: "CVS Health",
            brand: "CVS Pharmacy",
            description: "Multivitamin Complete, 60 Tablets",
            image: "/assets/images/cvs.jpg",
            price: "₹1,150",
            originalPrice: "₹1,500",
            discount: "23% OFF",
            rating: 4.4,
            reviews: "780",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Vitamins"
        },
        {
            id: 7,
            name: "Flux Capsules",
            brand: "Lupin",
            description: "Fluoxetine 20mg, 10 Capsules",
            image: "/assets/images/flux.jpg",
            price: "₹180",
            originalPrice: "₹225",
            discount: "20% OFF",
            rating: 4.5,
            reviews: "560",
            delivery: "FREE Delivery",
            stock: "Moderate stock",
            category: "Psychiatry"
        },
        {
            id: 8,
            name: "Ozempic Injection",
            brand: "Novo Nordisk",
            description: "Semaglutide 0.5mg, Pre-filled Pen",
            image: "/assets/images/ozempic.jpg",
            price: "₹8,500",
            originalPrice: "₹10,200",
            discount: "17% OFF",
            rating: 4.7,
            reviews: "320",
            delivery: "Cold Chain Delivery",
            stock: "Limited stock",
            category: "Endocrinology"
        },
        {
            id: 9,
            name: "Plavix Tablets",
            brand: "Sanofi",
            description: "Clopidogrel 75mg, 10 Tablets",
            image: "/assets/images/plavix.jpg",
            price: "₹1,250",
            originalPrice: "₹1,550",
            discount: "19% OFF",
            rating: 4.6,
            reviews: "920",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Cardiovascular"
        },
        {
            id: 10,
            name: "Tylenol Extra",
            brand: "Johnson & Johnson",
            description: "Acetaminophen 500mg, 24 Tablets",
            image: "/assets/images/tylenol.jpg",
            price: "₹210",
            originalPrice: "₹260",
            discount: "19% OFF",
            rating: 4.8,
            reviews: "2.8k",
            delivery: "FREE Delivery",
            stock: "High in stock",
            category: "Analgesic"
        }
    ]

    const toggleWishlist = (id: number) => {
        if (wishlist.includes(id.toString())) {
            setWishlist(wishlist.filter(item => item !== id.toString()))
        } else {
            setWishlist([...wishlist, id.toString()])
        }
    }

    // Split deals into groups for different rows
    const topRow = deals.slice(0, 4)
    const middleRow = deals.slice(4, 8)
    const bottomRow = deals.slice(8, 10)

    return (
        <div className="py-16 lg:py-24 bg-linear-to-b from-white to-primary-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <FaFire className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900">
                                Deal of the Day
                            </h2>
                        </div>
                        <p className="text-xl text-neutral-600">
                            Limited time offers on premium medicines. Hurry, these deals won&apos;t last!
                        </p>
                    </div>

                    <div className="mt-6 lg:mt-0 flex items-center gap-4">
                        <div className="flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                            <FaClock className="mr-2" />
                            <span className="font-semibold">
                                Ends in: {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                            </span>
                        </div>
                        <Link
                            href="/buyer_e8d45a1b"
                            className="flex items-center text-primary-600 hover:text-primary-700 font-semibold"
                        >
                            See All Products
                            <FaChevronRight className="ml-2" />
                        </Link>
                    </div>
                </div>

                {/* Timer Banner */}
                <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white mb-12">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                            <FaTag className="w-6 h-6 mr-3" />
                            <div>
                                <h3 className="text-xl font-bold">Flash Sale Active!</h3>
                                <p className="text-primary-200">All deals expire at midnight</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatTime(timeLeft.hours)}</div>
                                <div className="text-sm text-primary-200">Hours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatTime(timeLeft.minutes)}</div>
                                <div className="text-sm text-primary-200">Minutes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatTime(timeLeft.seconds)}</div>
                                <div className="text-sm text-primary-200">Seconds</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Row - 4 Products */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {topRow.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            wishlist={wishlist}
                            toggleWishlist={toggleWishlist}
                        />
                    ))}
                </div>

                {/* Middle Row - 4 Products */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {middleRow.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            wishlist={wishlist}
                            toggleWishlist={toggleWishlist}
                        />
                    ))}
                </div>

                {/* Bottom Row - 2 Products (Centered) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {bottomRow.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            wishlist={wishlist}
                            toggleWishlist={toggleWishlist}
                        />
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-16 text-center">
                    <div className="bg-linear-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 lg:p-12 border border-primary-100">
                        <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                            Can&apos;t Find What You Need?
                        </h3>
                        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
                            Browse our complete catalog of 50,000+ medicines from verified suppliers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/buyer_e8d45a1b"
                                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                            >
                                <FaShoppingCart className="mr-3" />
                                Browse All Products
                            </Link>
                        </div>
                        <p className="text-neutral-500 mt-6">
                            Bulk orders? Contact our team for special pricing
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Product Card Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductCard = ({ product, wishlist, toggleWishlist }: any) => {
    const isInWishlist = wishlist.includes(product.id.toString())

    return (
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-200 hover:border-primary-300 overflow-hidden">
            {/* Product Image & Badges */}
            <div className="relative h-48 overflow-hidden">
                <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={192}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Discount Badge */}
                <div className="absolute top-4 left-4">
                    <div className="bg-error-300 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <FaTag className="mr-1" />
                        {product.discount}
                    </div>
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                    <FaHeart className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-neutral-400'}`} />
                </button>

                {/* Category Tag */}
                <div className="absolute bottom-4 left-4">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium">
                        {product.category}
                    </span>
                </div>
            </div>

            {/* Product Details */}
            <div className="p-5">
                <div className="mb-3">
                    <span className="text-sm text-neutral-500">{product.brand}</span>
                    <h3 className="text-lg font-bold text-neutral-900 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{product.description}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{product.rating}</span>
                    <span className="text-sm text-neutral-500">({product.reviews})</span>
                </div>

                {/* Price & Delivery */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary-700">{product.price}</span>
                        <span className="text-neutral-400 line-through">{product.originalPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <FaTruck className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">{product.delivery}</span>
                    </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center text-sm text-neutral-500 mb-5">
                    <div className={`w-2 h-2 rounded-full mr-2 ${product.stock.includes('High') ? 'bg-green-500' : product.stock.includes('Limited') ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                    {product.stock}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center">
                        <FaShoppingCart className="mr-2" />
                        Add to Cart
                    </button>
                    <button className="px-4 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold rounded-lg transition-colors">
                        View
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Deals