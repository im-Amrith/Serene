import React, { useState, useRef } from 'react';
import { Camera, X, Scan } from 'lucide-react';
import { VisionService } from '../services/visionService';
import { callGroq, GroqMessage } from '../lib/groq';

interface DermScannerProps {
  onClose: () => void;
}

export const DermScanner: React.FC<DermScannerProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ risk: string; label: string; confidence: number; desc: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const analyzeSkin = async () => {
    if (!file) return;
    setIsScanning(true);
    
    try {
      // 1. Get visual description from Azure Vision
      const visualDescription = await VisionService.analyzeImageBinary(file);
      
      // 2. Send description to Groq (LLM) for dermatological assessment
      const messages: GroqMessage[] = [
        {
          role: "system",
          content: "You are a dermatologist AI assistant. Analyze the visual description of a skin lesion. Return ONLY a JSON object with: { 'risk': 'Low/Medium/High Risk', 'label': 'Condition Name', 'confidence': 85, 'desc': 'Brief medical description and recommendation.' }."
        },
        {
          role: "user",
          content: `Visual Description of skin lesion: ${visualDescription}`
        }
      ];

      const aiResponse = await callGroq(messages);
      
      // 3. Robust JSON Parsing
      const start = aiResponse.indexOf('{');
      const end = aiResponse.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
          const cleanJson = aiResponse.substring(start, end + 1);
          setResult(JSON.parse(cleanJson));
      } else {
        throw new Error("Invalid AI Response format");
      }

    } catch (error) {
      console.error("Derm Scan failed:", error);
      // Fallback for demo/error handling (optional, but good for robustness)
       setResult({
        risk: 'Unknown',
        label: 'Analysis Failed',
        confidence: 0,
        desc: 'Could not complete analysis. Please try again or consult a doctor.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-white">
            <Scan className="w-5 h-5 text-blue-400" />
            <span className="font-bold">Dermatology AI</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer"
            >
              <Camera className="w-12 h-12 mb-3" />
              <span className="font-medium">Upload Skin Photo</span>
              <span className="text-xs mt-1">Tap to select image</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img src={image} alt="Skin" className="w-full h-64 object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-white font-bold tracking-wider animate-pulse">ANALYZING...</span>
                  </div>
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent h-8 w-full animate-scan"></div>
                </div>
              )}
            </div>
          )}

          {image && !result && !isScanning && (
            <button 
              onClick={analyzeSkin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02]"
            >
              Analyze Lesion
            </button>
          )}

          {result && (
            <div className={`p-4 rounded-xl border ${
              result.risk === 'High Risk' ? 'bg-red-50 border-red-100' : 
              result.risk === 'Medium Risk' ? 'bg-yellow-50 border-yellow-100' : 
              'bg-green-50 border-green-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  result.risk === 'High Risk' ? 'bg-red-100 text-red-700' : 
                  result.risk === 'Medium Risk' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {result.risk}
                </span>
                <span className="text-slate-500 text-xs font-mono">Conf: {result.confidence}%</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{result.label}</h4>
              <p className="text-sm text-slate-600 mb-2">{result.desc}</p>
              <p className="text-xs text-slate-400 italic border-t border-slate-200 pt-2 mt-2">
                AI assessment based on visual pattern recognition. Consult a dermatologist for definitive diagnosis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
