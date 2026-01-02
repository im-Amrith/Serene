import React, { useState, useRef } from 'react';
import { Camera, Scan, Utensils, BookOpen, Leaf, Droplet, Save, Loader2, Upload } from 'lucide-react';
import { NutritionService } from '../services/nutritionService';
import { VisionService } from '../services/visionService';
import { callGroq, GroqMessage } from '../lib/groq';
import { useAuth } from '../context/AuthContext';

const NutritionAnalyzer = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'menu' | 'guide'>('scan');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setLoading(true);
    setAnalysisResult(null);

    try {
      if (activeTab === 'scan') {
        // Body Scan Logic
        const visionDescription = await VisionService.analyzeImageBinary(file);
        
        const messages: GroqMessage[] = [
          {
            role: "system",
            content: "You are a medical nutritionist. Analyze the visual description of a person's face/nails to detect potential nutritional deficiencies. Return a JSON object with: { 'detectedItems': ['Sign 1', 'Sign 2'], 'recommendations': ['Rec 1', 'Rec 2'], 'deficiency': 'Possible Deficiency Name' }."
          },
          {
            role: "user",
            content: `Visual Description: ${visionDescription}`
          }
        ];

        const aiResponse = await callGroq(messages);
        const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        setAnalysisResult(JSON.parse(cleanJson));

      } else if (activeTab === 'menu') {
        // Menu Scan Logic
        const menuTextLines = await VisionService.readText(file);
        const menuText = menuTextLines.join("\n");

        const messages: GroqMessage[] = [
          {
            role: "system",
            content: "You are a nutrition expert. Analyze the restaurant menu text. Identify the healthiest options. Return a JSON object with: { 'recommended': [{ 'name': 'Dish Name', 'reason': 'Why it is healthy', 'matchScore': 95 }], 'avoid': [{ 'name': 'Dish Name', 'reason': 'Why to avoid' }] }."
          },
          {
            role: "user",
            content: `Menu Text: ${menuText}`
          }
        ];

        const aiResponse = await callGroq(messages);
        const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        setAnalysisResult(JSON.parse(cleanJson));
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScan = async () => {
    if (!analysisResult || !user) return;
    setIsSaving(true);
    try {
      await NutritionService.saveScan({
        userId: user.uid,
        scanType: activeTab === 'scan' ? 'body' : 'menu',
        detectedItems: activeTab === 'scan' ? analysisResult.detectedItems : analysisResult.recommended.map((r: any) => r.name),
        recommendations: activeTab === 'scan' ? analysisResult.recommendations : analysisResult.recommended.map((r: any) => r.reason)
      });
      alert('Scan results saved to profile!');
    } catch (error) {
      console.error("Failed to save scan", error);
      alert('Failed to save scan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-blue-50/30 rounded-3xl min-h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nutrition Lab</h2>
          <p className="text-slate-500">Non-invasive deficiency detection and diet optimization.</p>
        </div>
        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-xl border border-white/50 shadow-sm">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'scan' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            Body Scan
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'menu' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            Menu Corrector
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'guide' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            Nutrition Guide
          </button>
        </div>
      </div>

      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Interface */}
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-green-500/50 transition-colors"
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Scan" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/5 z-10"></div>
                  <Scan className="w-12 h-12 text-green-600 mb-4 z-20" />
                  <p className="text-slate-600 font-medium z-20">Upload Photo (Face/Nails)</p>
                  <p className="text-xs text-slate-400 mt-2 z-20">Detecting: Pale eyelids, skin texture</p>
                </>
              )}
              
              {/* Scanning Overlay Animation */}
              {loading && (
                <div className="absolute inset-0 bg-black/20 z-30 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                    <p className="text-white font-bold">Analyzing...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-green-600/20 transform hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">Detected Signs</h3>
                {analysisResult && (
                  <button 
                    onClick={handleSaveScan}
                    disabled={isSaving}
                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Results'}</span>
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {analysisResult ? (
                  <>
                    {analysisResult.detectedItems?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                        <div>
                          <h4 className="text-red-900 font-semibold">{item}</h4>
                          <p className="text-sm text-red-700/80 mt-1">Potential deficiency detected.</p>
                        </div>
                      </div>
                    ))}
                    {analysisResult.deficiency && (
                       <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <h4 className="text-amber-900 font-bold">Diagnosis: {analysisResult.deficiency}</h4>
                       </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <p>Upload a photo to see analysis results.</p>
                  </div>
                )}
              </div>
            </div>

            {analysisResult && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100 shadow-sm">
                <h3 className="text-lg font-bold text-green-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {analysisResult.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-center space-x-2 text-green-800">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Smart Menu Scanner</h3>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl h-64 flex flex-col items-center justify-center bg-slate-50/50 hover:border-green-500/50 transition-colors cursor-pointer group relative overflow-hidden"
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Menu" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-green-500" />
                  </div>
                  <p className="text-slate-600 font-medium">Scan Restaurant Menu</p>
                  <p className="text-xs text-slate-400 mt-2">AI will highlight dishes matching your needs</p>
                </>
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/20 z-30 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
                    <p className="text-white font-bold">Reading Menu...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-800">Analysis Results</h3>
               {analysisResult && (
                  <button 
                    onClick={handleSaveScan}
                    disabled={isSaving}
                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                )}
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {analysisResult ? (
                <>
                  {analysisResult.recommended?.map((dish: any, idx: number) => (
                    <div key={idx} className="p-4 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="text-green-900 font-bold">{dish.name}</h4>
                        <p className="text-xs text-green-700 mt-1 font-medium">{dish.reason}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold border border-green-200">{dish.matchScore || 90}% Match</span>
                    </div>
                  ))}
                  {analysisResult.avoid?.map((dish: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white/60 rounded-2xl border border-slate-100 flex justify-between items-center opacity-60 grayscale hover:grayscale-0 transition-all">
                      <div>
                        <h4 className="text-slate-600 font-medium">{dish.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{dish.reason}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200">Avoid</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p>Upload a menu photo to see recommendations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Daily Nutrition Guide</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <h4 className="text-green-900 font-semibold">Superfoods for You</h4>
                </div>
                <p className="text-sm text-green-800/80 leading-relaxed">Based on your recent scan, incorporate more <span className="font-bold text-green-700">Leafy Greens</span> and <span className="font-bold text-green-700">Citrus Fruits</span> to boost iron absorption.</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  <h4 className="text-blue-900 font-semibold">Hydration Goal</h4>
                </div>
                <p className="text-sm text-blue-800/80">Target: <span className="font-bold text-blue-700">2.5 Liters</span> today. You are currently at 1.2L.</p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Meal Plan</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-2 h-full bg-slate-200 rounded-full relative min-h-[120px]">
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-green-500 rounded-full shadow-lg shadow-green-500/30"></div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm">
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Breakfast</h4>
                    <p className="text-slate-700 font-semibold">Oatmeal with Berries & Almonds</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm">
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Lunch</h4>
                    <p className="text-slate-700 font-semibold">Grilled Chicken Salad with Spinach</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm">
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Dinner</h4>
                    <p className="text-slate-700 font-semibold">Baked Salmon with Asparagus</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionAnalyzer;
