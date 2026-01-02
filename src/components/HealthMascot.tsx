import React, { useState, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import confetti from 'canvas-confetti';
import { Zap, Heart } from 'lucide-react';

// Placeholder imports - In a real scenario, these would be your actual JSON files
// For now, we'll use a simple object if the files are missing to prevent crash, 
// but the code assumes these imports work as requested.
import puppyHappy from '../assets/puppy_happy.json';
import puppyIdle from '../assets/puppy_idle.json';
import puppySleep from '../assets/puppy_sleep.json';

interface HealthMascotProps {
  score: number;
}

export const HealthMascot: React.FC<HealthMascotProps> = ({ score }) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Determine mood based on score
  const getMood = () => {
    if (score > 80) return { 
        animation: puppyHappy, 
        label: 'Happy', 
        text: "Feeling great! Keep up the good work!", 
        color: "text-green-600",
        bgGlow: "bg-green-400/20"
    };
    if (score >= 50) return { 
        animation: puppyIdle, 
        label: 'Neutral', 
        text: "Doing okay, but let's stay consistent.", 
        color: "text-blue-600",
        bgGlow: "bg-blue-400/20"
    };
    return { 
        animation: puppySleep, 
        label: 'Tired', 
        text: "I need some rest... and maybe some water.", 
        color: "text-slate-500",
        bgGlow: "bg-slate-400/20"
    };
  };

  const mood = getMood();

  const handlePet = () => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#60A5FA', '#34D399', '#F472B6'],
      zIndex: 1000,
    });
    
    // Play animation faster momentarily to simulate excitement
    if (lottieRef.current) {
        lottieRef.current.setSpeed(2);
        setTimeout(() => lottieRef.current?.setSpeed(1), 1000);
    }
  };

  return (
    <div 
        className="relative h-full min-h-[320px] p-6 pb-20 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm flex flex-col items-center justify-center transition-all duration-500 overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient Background Glow */}
      <div className={`absolute inset-0 opacity-30 blur-3xl transition-colors duration-500 ${mood.bgGlow}`}></div>

      {/* Lottie Animation */}
      <div className="w-full h-48 flex items-center justify-center relative z-10 transform transition-transform duration-300 group-hover:scale-110">
        {/* Fallback if animation data is missing (for development safety) */}
        {mood.animation ? (
            <Lottie 
                lottieRef={lottieRef}
                animationData={mood.animation} 
                loop={true}
                autoplay={true}
                className="h-full w-full"
            />
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
                <Heart className={`w-24 h-24 ${score > 80 ? 'text-red-500 animate-bounce' : 'text-slate-300'}`} />
                <span className="text-xs mt-2">Animation Placeholder</span>
            </div>
        )}
      </div>

      {/* Text Content */}
      <div className="text-center relative z-10 mt-4">
        <h3 className="text-2xl font-bold text-slate-800 mb-1">Vitalis</h3>
        <p className={`text-sm font-medium ${mood.color} max-w-[200px] transition-all duration-300`}>
            {mood.text}
        </p>
      </div>

      {/* Pet Me Button */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-20">
        <button 
            onClick={handlePet}
            className="bg-white/80 backdrop-blur-md text-blue-600 px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-white hover:scale-105 hover:shadow-md transition-all active:scale-95 flex items-center justify-center mx-auto space-x-2 border border-white/50"
        >
            <span>Pet Me</span>
            <Zap className="w-4 h-4 fill-current text-yellow-400" />
        </button>
      </div>
    </div>
  );
};
