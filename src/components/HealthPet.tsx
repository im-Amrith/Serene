import React from 'react';
import { Heart, Zap, Battery, AlertTriangle, Sparkles } from 'lucide-react';
import { PetState } from '../services/gamificationService';

interface HealthPetProps {
  petState: PetState;
}

export const HealthPet: React.FC<HealthPetProps> = ({ petState }) => {
  const getPetVisuals = () => {
    switch (petState.mood) {
      case 'super':
        return {
          icon: <Sparkles className="w-24 h-24 text-yellow-400 animate-pulse" />,
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500',
          animation: 'animate-bounce'
        };
      case 'happy':
        return {
          icon: <Heart className="w-24 h-24 text-pink-500 animate-pulse" />,
          bg: 'bg-pink-500/20',
          border: 'border-pink-500',
          animation: 'animate-bounce'
        };
      case 'tired':
        return {
          icon: <Battery className="w-24 h-24 text-blue-400" />,
          bg: 'bg-blue-500/20',
          border: 'border-blue-500',
          animation: ''
        };
      case 'sick':
        return {
          icon: <AlertTriangle className="w-24 h-24 text-red-500" />,
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          animation: 'animate-pulse'
        };
    }
  };

  const visuals = getPetVisuals();

  return (
    <div className={`relative h-full min-h-[320px] p-6 pb-20 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm flex flex-col items-center justify-center space-y-4 transition-all duration-500 overflow-hidden`}>
      {/* Ambient Background Glow */}
      <div className={`absolute inset-0 opacity-30 ${visuals.bg} blur-3xl`}></div>
      
      <div className="absolute top-4 right-4 bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm">
        Lvl {petState.level}
      </div>
      
      <div className={`transform transition-all duration-500 ${visuals.animation} relative z-10 drop-shadow-xl`}>
        {visuals.icon}
      </div>

      <div className="text-center relative z-10">
        <h3 className="text-2xl font-bold text-slate-800 mb-1">{petState.name}</h3>
        <p className="text-sm text-slate-500 max-w-[200px]">{petState.description}</p>
      </div>

      {/* Generative AI Badge */}
      <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-70">
        <Zap className="w-3 h-3 text-purple-500" />
        <span className="text-[10px] text-purple-600 font-medium">GenAI Texture</span>
      </div>
    </div>
  );
};
