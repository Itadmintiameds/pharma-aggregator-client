"use client"
import React from 'react';
import Header from "@/src/app/components/Header";
import SellerJourney from './SellerJourney';
import Footer from '../../components/landingPage/Footer';

const SellerHome = () => {
    return (
        <div>
            <Header />
            <SellerJourney />
            <Footer />
        </div>
    )
}

export default SellerHome;