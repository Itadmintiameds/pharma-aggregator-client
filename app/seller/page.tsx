import React from 'react'
import Header from '../components/Header'
import Section from './components/Section'
const page = () => {
  return (
    <div>
    <div className="bg-[#F3ECF8] ">
        <Header/>
    </div>
    <div className='mt-4 ml-10'>
        <Section/>
    </div>
    </div>
  )
}

export default page