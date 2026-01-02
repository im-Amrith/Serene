import { createContext, useContext, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
  speak: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  const toggleSimpleMode = () => {
    setIsSimpleMode(prev => !prev);
    if (!isSimpleMode) {
      speak("Simple mode enabled. Large buttons active.");
    } else {
      speak("Standard mode enabled.");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ isSimpleMode, toggleSimpleMode, speak }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
