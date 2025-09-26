'use client';

import React, { useState, useEffect } from 'react';
import {ChevronDown, Star,} from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function Hero({ onLoginClick }: { onLoginClick: () => void }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  
  const handleScroll = () => {
    const section = document.getElementById("about");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <>
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#042F01] to-[#055B00]">
      {/* Mouse tracking gradient */}
      {mounted && (
        <div 
          className="absolute inset-0 opacity-90 transition-all duration-300"
          style={{
            background: `radial-gradient(500px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 90%)`
          }}
        />
      )}
      
      {/* Animated stars */}
      <div className="absolute inset-0">
        {mounted && [...Array(50)].map((_, i) => {
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const size = Math.random() * 4 + 1;
          const delay = Math.random() * 3;
          const duration = 2 + Math.random() * 3;
          
          return (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            >
              <Star size={size} className="text-white opacity-40" />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up">
          Welcome to the{" "}
          <span className="bg-[#0FA34A] bg-clip-text text-transparent">
            Future
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up" style={{animationDelay: '300ms'}}>
          Turning Inquiries Into Lasting Partnerships
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '600ms'}}>
          <button onClick={onLoginClick} className="bg-[#0FA34A] hover:bg-[#0C8A3E] text-white cursor-pointer px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl">
            Get Started
          </button>
          <button   onClick={handleScroll} className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transform hover:scale-105 transition-all duration-300">
            Learn More
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown size={32} className="text-white opacity-90" />
      </div>
    </section>
    </>
  )
}
