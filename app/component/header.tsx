'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Détection du scroll pour changer le style de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100 py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- PARTIE GAUCHE : LOGO --- */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Conteneur Image avec animation légère au survol */}
              <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/logo.png"
                  alt="DataPilot Logo"
                  width={100} // Augmenté pour la netteté retina
                  height={100}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>

            </Link>
          </div>

          {/* --- PARTIE DROITE : MENU DESKTOP --- */}
          <div className="hidden md:flex items-center space-x-8">
 <Link
  href="/about"
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md
             bg-blue-600 hover:bg-blue-500
             text-sm font-medium text-white
             transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-blue-500/50"
>
  À propos
  <svg
    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
</Link>

            <Link
              href="/login"
              className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-semibold text-white transition-all duration-300 ease-out bg-slate-900 rounded-full group hover:shadow-lg hover:shadow-blue-500/40"
            >
              {/* Fond dégradé animé */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500"></span>
              <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 opacity-30 group-hover:rotate-90 ease"></span>
              <span className="relative flex items-center gap-2">
                Se connecter
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </span>
            </Link>
          </div>

          {/* --- BOUTON MENU MOBILE --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-blue-600 focus:outline-none p-2 rounded-md hover:bg-slate-50 transition-colors"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE (Backdrop & Slide) --- */}
      <div 
        className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl transition-all duration-300 ease-in-out origin-top ${
          isMobileMenuOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-4 py-6 space-y-3">
          <Link
            href="/about"
            className="block px-4 py-3 rounded-lg text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="block px-4 py-3 rounded-lg text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contactez-nous
          </Link>
          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-3 rounded-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 shadow-md hover:shadow-lg transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;