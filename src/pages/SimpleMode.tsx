import React from 'react';
import { Pill, Phone, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const SimpleMode = () => {
  const { toggleSimpleMode, speak } = useAccessibility();

  const handleMedicineClick = () => {
    speak("Opening your medicine list. You have 2 pills to take.");
    // In a real app, this might navigate to a simplified medicine view
  };

  const handleHelpClick = () => {
    speak("Calling emergency contact.");
    alert("Calling Emergency Contact...");
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col p-4">
      <div className="flex justify-end">
        <button 
          onClick={toggleSimpleMode}
          className="text-gray-500 p-4 flex items-center space-x-2"
        >
          <X className="w-8 h-8" />
          <span className="text-xl">Exit Simple Mode</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-8 justify-center max-w-4xl mx-auto w-full">
        <button 
          onClick={handleMedicineClick}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl flex flex-col items-center justify-center space-y-4 shadow-xl transition-transform active:scale-95"
        >
          <Pill className="w-32 h-32" />
          <span className="text-6xl font-bold">Medicine</span>
        </button>

        <button 
          onClick={handleHelpClick}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-3xl flex flex-col items-center justify-center space-y-4 shadow-xl transition-transform active:scale-95"
        >
          <Phone className="w-32 h-32" />
          <span className="text-6xl font-bold">Help</span>
        </button>
      </div>
    </div>
  );
};

export default SimpleMode;
