import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mic, Image as ImageIcon, MapPin, Send, AlertCircle, Save, Brain, Heart, Stethoscope, Sparkles, FileText, HelpCircle, Scan, Activity } from 'lucide-react';
import { SymptomService, ChatMessage } from '../services/symptomService';
import { AgentOrchestrator } from '../ai/AgentSystem';
import { TrustIndicator } from '../components/TrustIndicator';
import { BodyMapWidget } from '../components/BodyMapWidget';
import { generateSOAPNote, SOAPNote } from '../services/soapService';
import { DoctorReportCard } from '../components/DoctorReportCard';
import { DermScanner } from '../components/DermScanner';
import { useAuth } from '../context/AuthContext';

const SymptomChecker = () => {
  const navigate = useNavigate();
  const orchestrator = useMemo(() => new AgentOrchestrator(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: 'bot', text: 'Hello! I am your Clinical Triage Assistant. I can help analyze your symptoms using verified medical data. How are you feeling today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<number, boolean>>({});
  const [showDermScanner, setShowDermScanner] = useState(false);

  const toggleReasoning = (idx: number) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleGenerateReport = async () => {
    if (messages.length < 2) {
      alert("Please have a conversation first to generate a report.");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const note = await generateSOAPNote(messages);
      setSoapNote(note);
      setShowReport(true);
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Failed to generate clinical summary. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Smart Chip Logic
  useEffect(() => {
    if (input.toLowerCase().includes('head')) {
      setSuggestedChips(['Throbbing?', 'Light Sensitivity?', 'Nausea?', 'Dizziness?']);
    } else if (input.toLowerCase().includes('stomach') || input.toLowerCase().includes('pain')) {
      setSuggestedChips(['Sharp pain?', 'Bloating?', 'After eating?', 'Radiating?']);
    } else if (input.length > 2) {
      setSuggestedChips(['Severe', 'Mild', 'Just started', 'Recurring']);
    } else {
      setSuggestedChips([]);
    }
  }, [input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const userMsg: ChatMessage = { 
          type: 'user', 
          text: "Uploaded an image", 
          imageUrl: base64String,
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, userMsg]);
        // Trigger agent response for image
        setTimeout(() => {
             const botMsg: ChatMessage = { 
                type: 'bot', 
                text: "I see you've uploaded an image. While I can analyze it, please also describe what you are experiencing.",
                timestamp: new Date(),
                agent: 'Visual Analysis',
                confidence: 85
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } else {
        alert("Speech recognition not supported in this browser");
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textOverride?: string | any, skipTriggers: boolean = false) => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : input);
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { type: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSuggestedChips([]);
    
    // Agentic Workflow
    try {
      // Check for "pain" keyword to trigger Body Map demo
      if (!skipTriggers && (textToSend.toLowerCase().includes('pain') || textToSend.toLowerCase().includes('hurt'))) {
         setTimeout(() => {
            const botMsg: ChatMessage = { 
                type: 'bot', 
                text: "Could you point to where it hurts on this map? <DISPLAY_BODY_MAP />",
                timestamp: new Date(),
                agent: 'Triage',
                confidence: 95
            };
            setMessages(prev => [...prev, botMsg]);
         }, 1000);
         return;
      }

      const result = await orchestrator.processRequest(textToSend);
      
      const botMsg: ChatMessage = { 
        type: 'bot', 
        text: result.response,
        timestamp: new Date(),
        agent: result.agent,
        thoughtProcess: result.thoughtProcess,
        citation: result.citation,
        confidence: result.confidence
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Agent Error:", error);
      const errorMsg: ChatMessage = {
        type: 'bot',
        text: "I'm having trouble connecting to the agent network. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleBodyPartSelect = (part: string) => {
      handleSend(`I have pain in my ${part}`, true);
  };

  const handleSaveSession = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await SymptomService.saveSession(user.uid, messages);
      alert('Session saved to history!');
    } catch (error) {
      console.error("Failed to save session", error);
      alert('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 p-6 bg-blue-50/30 rounded-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clinical Triage Assistant</h2>
          <p className="text-slate-500">RAG-powered symptom analysis with verified citations.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/mirror-check')}
            className="flex items-center space-x-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl transition-colors shadow-sm shadow-rose-200 animate-pulse"
          >
            <Activity className="w-4 h-4" />
            <span>Check Vitals</span>
          </button>
          <button 
            onClick={() => setShowDermScanner(true)}
            className="flex items-center space-x-2 bg-white/60 hover:bg-white text-slate-600 px-4 py-2 rounded-xl transition-colors shadow-sm border border-white/50"
          >
            <Scan className="w-4 h-4" />
            <span>Derm Scanner</span>
          </button>
          <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingReport ? 'Generating...' : 'Clinical Summary'}</span>
          </button>
          <button 
            onClick={handleSaveSession}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-white/60 hover:bg-white text-slate-600 px-4 py-2 rounded-xl transition-colors shadow-sm border border-white/50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Session'}</span>
          </button>
          <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-xl border border-purple-200 shadow-sm">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 text-sm font-medium">Outbreak Alert: Flu spike in your area</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-none shadow-blue-500/20' 
                  : 'bg-white/80 backdrop-blur-md text-slate-700 rounded-tl-none border border-white/50'
              }`}>
                {msg.agent && (
                  <div className="mb-3 flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-lg flex items-center space-x-1 font-medium border ${
                      msg.agent === 'Research' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-pink-50 text-pink-600 border-pink-100'
                    }`}>
                      {msg.agent === 'Research' ? <Stethoscope className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                      <span>{msg.agent} Agent</span>
                    </span>
                  </div>
                )}
                {msg.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/30">
                    <img src={msg.imageUrl} alt="User upload" className="max-w-full h-auto max-h-64 object-cover" />
                  </div>
                )}
                {msg.text.includes('<DISPLAY_BODY_MAP />') ? (
                  <div>
                    <p className="leading-relaxed mb-4">{msg.text.replace('<DISPLAY_BODY_MAP />', '')}</p>
                    <BodyMapWidget onSelect={handleBodyPartSelect} />
                  </div>
                ) : (
                  <p className="leading-relaxed">{msg.text}</p>
                )}
                {msg.thoughtProcess && (
                   <div className="mt-2">
                     <button 
                       onClick={() => toggleReasoning(idx)}
                       className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 transition-colors"
                     >
                       <HelpCircle className="w-3 h-3" />
                       <span>Why did you say that?</span>
                     </button>
                     {expandedReasoning[idx] && (
                       <div className="mt-2 p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-100 animate-in fade-in slide-in-from-top-1">
                         <div className="flex items-center space-x-1 mb-1 text-slate-500 font-semibold">
                           <Brain className="w-3 h-3" />
                           <span>Medical Logic / Guidelines:</span>
                         </div>
                         {msg.thoughtProcess}
                       </div>
                     )}
                   </div>
                )}
                
                {/* Trust Engine Display */}
                {msg.type === 'bot' && msg.confidence !== undefined && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <TrustIndicator 
                        confidence={msg.confidence} 
                        citation={msg.citation} 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Smart Chips */}
        {suggestedChips.length > 0 && (
          <div className="px-6 pb-2 flex space-x-2 overflow-x-auto">
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium transition-colors animate-fade-in"
              >
                <Sparkles className="w-3 h-3" />
                <span>{chip}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/50">
          <div className="flex items-center space-x-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" 
              title="Upload Photo"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} 
              title="Record Audio"
            >
              <Mic className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your symptoms..."
                className="w-full bg-white/80 text-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400 border border-white/50 shadow-inner"
              />
            </div>
            <button 
              onClick={() => handleSend()}
              className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showReport && soapNote && (
        <DoctorReportCard 
          note={soapNote} 
          onClose={() => setShowReport(false)} 
        />
      )}
      {showDermScanner && (
        <DermScanner onClose={() => setShowDermScanner(false)} />
      )}
    </div>
  );
};

export default SymptomChecker;
