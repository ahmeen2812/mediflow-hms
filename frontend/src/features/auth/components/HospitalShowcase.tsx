import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Award, HeartPulse } from 'lucide-react';

interface Slide {
  image: string;
  facility: string;
  tagline: string;
  badge: string;
}

const HOSPITAL_SLIDES: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
    facility: 'Central Medical Tower & Trauma Pavilion',
    tagline: 'Precision Outpatient Care & Advanced Clinical Architecture',
    badge: 'Tertiary Care Center'
  },
  {
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    facility: 'Institute of Cardiovascular Therapeutics',
    tagline: 'Interventional Cardiology, Electrophysiology & Surgical Suites',
    badge: 'Cardiac Directorate'
  },
  {
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    facility: 'Diagnostic Imaging & Automated Laboratory Complex',
    tagline: 'Continuous Point-of-Care Testing & 24/7 Formulary Dispensing',
    badge: 'ISO-15189 Accredited'
  }
];

export const HospitalShowcase: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HOSPITAL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HOSPITAL_SLIDES[currentSlide];

  return (
    <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 sm:p-10 bg-[#102A6B] text-white select-none relative overflow-hidden">
      
      {/* 1. AUTO-ADVANCING ARCHITECTURAL SLIDESHOW WITH SMOOTH CROSSFADE */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.32, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('${slide.image}')` }}
        />
      </AnimatePresence>

      {/* SOLID OVERLAY VIGNETTE */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1F4D] via-transparent to-[#102A6B]/80 pointer-events-none" />

      {/* 2. TOP BRAND TITLE & ANIMATED ECG CARDIAC LINE */}
      <div className="z-10 space-y-2">
        <div className="flex justify-between items-center text-xs tracking-widest uppercase font-bold text-sky-200">
          <span>Elixora Health Care</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 border border-white/15">
            Since 2026
          </span>
        </div>

        {/* Animated ECG Pulse Rhythm Vector */}
        <div className="w-full h-8 overflow-hidden relative opacity-70">
          <svg viewBox="0 0 500 50" className="w-full h-full stroke-sky-300 fill-none" preserveAspectRatio="none">
            <motion.path
              d="M 0 25 L 120 25 L 135 10 L 150 42 L 165 5 L 180 35 L 195 25 L 320 25 L 335 10 L 350 42 L 365 5 L 380 35 L 395 25 L 500 25"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>
      </div>

      {/* 3. CENTER SHOWCASE: DYNAMIC FACILITY OVERVIEW */}
      <div className="my-auto z-10 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="space-y-2.5"
          >
            <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-white/15 border border-white/20 text-sky-200">
              <HeartPulse size={12} className="mr-1.5 text-sky-300" />
              {slide.badge}
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
              {slide.facility}
            </h2>

            <p className="text-xs text-sky-100/80 leading-relaxed font-normal max-w-sm">
              {slide.tagline}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* SLIDE PROGRESSION DOTS */}
        <div className="flex space-x-2 pt-2">
          {HOSPITAL_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === index ? 'w-8 bg-sky-300' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              title={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 4. BOTTOM INSTITUTIONAL VERIFICATION */}
      <div className="z-10 pt-4 border-t border-white/15 flex justify-between items-center text-[11px] text-white/70">
        <div className="flex items-center space-x-1.5">
          <Award size={13} className="text-sky-300" />
          <span>JCI & Healthcare Commission Certified</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck size={13} className="text-emerald-300" />
          <span>Continuous Security Audit</span>
        </div>
      </div>
    </div>
  );
};