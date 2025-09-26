'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


const Navbar = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div
              className={`text-2xl font-bold transition-colors duration-300 ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              Multifactors Sales
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {['About', 'Projects', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:text-green-600 ${
                  isScrolled
                    ? 'text-gray-900'
                    : 'text-white hover:text-blue-300'
                }`}
              >
                {item}
              </a>
            ))}
            {/* Login Button */}
            <button
              onClick={onLoginClick}
              className="bg-[#0FA34A] hover:bg-[#0C8A3E] text-white px-6 py-2 rounded-full font-medium transition-transform duration-300 hover:scale-105 hover:opacity-90 cursor-pointer"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center">
              <span
                className={`block h-0.5 w-6 bg-current transform transition duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-current mt-1 transition duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-current mt-1 transform transition duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {['Home', 'About', 'Services', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-900 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            {/* Mobile Login Button */}
            <button
              onClick={onLoginClick}
              className="w-full bg-[#0FA34A] hover:bg-[#0C8A3E] text-white px-3 py-2 rounded-full font-medium mt-2 transition-transform duration-300 hover:scale-105 hover:opacity-90"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
