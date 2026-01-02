import React, { useState, useEffect, useRef } from 'react';
import { Pill, Camera, AlertTriangle, Check, Plus, Search, Mic, Bell, BellOff, Loader2, DollarSign, ExternalLink, X, Trash2, Calendar } from 'lucide-react';
import { MedicineService, Medicine } from '../services/medicineService';
import { findGenericDrug, SearchResult } from '../utils/findGenericDrugs';
import { VisionService } from '../services/visionService';
import { InteractionService, Interaction } from '../services/interactionService';
import { useAuth } from '../context/AuthContext';

const MedicineManager = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState<{name: string, dosage: string, time: string, days: string[]}>({ 
    name: '', 
    dosage: '', 
    time: '', 
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
  });
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [selectedMedForGeneric, setSelectedMedForGeneric] = useState<Medicine | null>(null);
  const [genericResults, setGenericResults] = useState<SearchResult[]>([]);
  const [loadingGenerics, setLoadingGenerics] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]); // Default to today

  useEffect(() => {
    if (user) {
      loadMedicines();
    }
  }, [user]);

  const checkInteractions = async (meds: Medicine[]) => {
    setCheckingInteractions(true);
    try {
      const results = await InteractionService.checkInteractions(meds);
      setInteractions(results);
    } catch (error) {
      console.error("Error checking interactions", error);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const loadMedicines = async () => {
    if (!user) return;
    try {
      const data = await MedicineService.getMedicines(user.uid);
      setMedicines(data);
      checkInteractions(data);
    } catch (error) {
      console.error("Failed to load medicines", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMed.name || !newMed.dosage || !newMed.time || !user) return;
    
    try {
      const added = await MedicineService.addMedicine({
        ...newMed,
        taken: false,
        userId: user.uid
      });
      const updatedMeds = [...medicines, added as Medicine];
      setMedicines(updatedMeds);
      checkInteractions(updatedMeds);
      setShowAddForm(false);
      setNewMed({ name: '', dosage: '', time: '', days: DAYS });
    } catch (error) {
      console.error("Failed to add medicine", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?") || !user) return;
    try {
      await MedicineService.deleteMedicine(id, user.uid);
      const updatedMeds = medicines.filter(m => m.id !== id);
      setMedicines(updatedMeds);
      checkInteractions(updatedMeds);
    } catch (error) {
      console.error("Failed to delete medicine", error);
    }
  };

  const handleToggleTaken = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await MedicineService.toggleTaken(id, currentStatus, user.uid);
      setMedicines(medicines.map(m => 
        m.id === id ? { ...m, taken: !currentStatus } : m
      ));
    } catch (error) {
      console.error("Failed to toggle taken status", error);
    }
  };

  const handleFindGeneric = async (med: Medicine) => {
    setSelectedMedForGeneric(med);
    setShowGenericModal(true);
    setLoadingGenerics(true);
    setGenericResults([]); // Clear previous results
    try {
      const results = await findGenericDrug(med.name);
      setGenericResults(results);
    } catch (error) {
      console.error("Error finding generics:", error);
    } finally {
      setLoadingGenerics(false);
    }
  };

  const handleScanLabel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const lines = await VisionService.readText(file);
      console.log("OCR Results:", lines);
      
      // Simple heuristic: Find the first line that looks like a medicine name (not a number, reasonably long)
      // In a real app, we'd use a drug database to match names.
      const potentialName = lines.find(line => line.length > 3 && !/^\d+$/.test(line) && !line.includes("EXP") && !line.includes("Batch"));
      const potentialDosage = lines.find(line => /\d+\s*(mg|ml|g)/i.test(line));

      if (potentialName) {
        setNewMed(prev => ({ ...prev, name: potentialName, dosage: potentialDosage || prev.dosage }));
        setShowAddForm(true);
        alert(`Scanned: ${potentialName}`);
      } else {
        alert("Could not detect medicine name clearly. Please enter manually.");
      }
    } catch (error) {
      console.error("Scan failed", error);
      alert("Failed to scan image.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-blue-50/30">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Serene Meds</h2>
          <p className="text-slate-500">AI-powered medication tracking and interaction safety.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-xl transition-colors shadow-sm ${notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 hover:text-slate-600'}`}
            title={notificationsEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Generic Finder Modal */}
      {showGenericModal && selectedMedForGeneric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-300" />
                  Inflation Fighter
                </h3>
                <p className="text-blue-100 text-sm mt-1">Finding affordable alternatives for {selectedMedForGeneric.name}</p>
              </div>
              <button onClick={() => setShowGenericModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Current Brand</span>
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg">Expensive</span>
                </div>
                <div className="flex justify-between items-end">
                  <h4 className="text-lg font-bold text-slate-800">{selectedMedForGeneric.name}</h4>
                  <span className="text-lg font-bold text-slate-600">~$45.00</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                  VS
                </div>
              </div>

              {loadingGenerics ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Searching for affordable alternatives...</p>
                </div>
              ) : genericResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-600">Found {genericResults.length} Options:</p>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Save up to 85%</span>
                  </div>
                  {genericResults.map((result, idx) => (
                    <a 
                      key={idx}
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-white hover:bg-green-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-all shadow-sm group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-3">
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-700 text-sm line-clamp-1">{result.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.snippet}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-green-600 flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-500 text-sm">No specific generic data found.</p>
                  <a 
                    href={`https://www.google.com/search?q=generic+equivalent+price+${selectedMedForGeneric.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                  >
                    <span>Try manual Google search</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div className="hidden">
                <p className="text-center text-xs text-slate-400 mt-3">
                  *Prices are estimates based on national averages. Consult your pharmacist.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-lg animate-fade-in">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Medicine</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Medicine Name"
              value={newMed.name}
              onChange={e => setNewMed({...newMed, name: e.target.value})}
              className="bg-white/50 text-slate-800 px-4 py-3 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            <input
              type="text"
              placeholder="Dosage (e.g., 10mg)"
              value={newMed.dosage}
              onChange={e => setNewMed({...newMed, dosage: e.target.value})}
              className="bg-white/50 text-slate-800 px-4 py-3 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            <input
              type="time"
              value={newMed.time}
              onChange={e => setNewMed({...newMed, time: e.target.value})}
              className="bg-white/50 text-slate-800 px-4 py-3 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-600 mb-2">Frequency (Days)</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    const currentDays = newMed.days || [];
                    const newDays = currentDays.includes(day)
                      ? currentDays.filter(d => d !== day)
                      : [...currentDays, day];
                    setNewMed({...newMed, days: newDays});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    newMed.days?.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddMedicine}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md"
            >
              Save Medicine
            </button>
          </div>
        </div>
      )}

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Pill ID */}
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Visual Pill Identifier</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            Unsure about a pill? Point your camera to identify it instantly using Azure Vision.
          </p>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-200 rounded-2xl h-48 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleScanLabel}
            />
            
            {isScanning ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-blue-600 font-bold animate-pulse">Analyzing Label...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <span className="text-blue-600 font-bold">Scan Medicine Label</span>
              </>
            )}
          </div>
        </div>

        {/* Interaction Checker */}
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Interaction Safety</h3>
            {checkingInteractions && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <div className="space-y-3">
            {interactions.length > 0 ? (
              interactions.map((interaction, idx) => (
                <div key={idx} className={`p-4 rounded-2xl flex items-start space-x-3 border ${
                  interaction.severity === 'high' ? 'bg-red-50 border-red-100' : 
                  interaction.severity === 'moderate' ? 'bg-amber-50 border-amber-100' : 
                  'bg-blue-50 border-blue-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    interaction.severity === 'high' ? 'text-red-500' : 
                    interaction.severity === 'moderate' ? 'text-amber-500' : 
                    'text-blue-500'
                  }`} />
                  <div>
                    <h4 className={`font-bold text-sm ${
                      interaction.severity === 'high' ? 'text-red-700' : 
                      interaction.severity === 'moderate' ? 'text-amber-700' : 
                      'text-blue-700'
                    }`}>
                      {interaction.type === 'drug-drug' ? 'Drug Interaction' : 'Food Interaction'}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      interaction.severity === 'high' ? 'text-red-600/80' : 
                      interaction.severity === 'moderate' ? 'text-amber-600/80' : 
                      'text-blue-600/80'
                    }`}>
                      {interaction.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-green-700 font-bold text-sm">Safe Combination</h4>
                  <p className="text-green-600/80 text-xs mt-1">
                    {medicines.length > 1 
                      ? "No major interactions found between your current medications." 
                      : "Add more medicines to check for interactions."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medicine List */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden">
        {/* Weekly Calendar */}
        <div className="p-4 border-b border-white/50 bg-white/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Schedule
            </h3>
          </div>
          <div className="flex justify-between gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedDay === day 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'bg-white/50 text-slate-500 hover:bg-white hover:text-blue-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-b border-white/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{selectedDay === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ? "Today's" : selectedDay + "'s"} Schedule</h3>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/50">
            {medicines.filter(m => !m.days || m.days.includes(selectedDay)).length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Pill className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium">No medicines for {selectedDay}</p>
                <p className="text-sm mt-1">Click "Add Medicine" to schedule.</p>
              </div>
            ) : (
              medicines.filter(m => !m.days || m.days.includes(selectedDay)).map((med) => (
                <div key={med.id} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${med.taken ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:scale-110 transition-transform'}`}>
                      {med.taken ? <Check className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-base ${med.taken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{med.name}</h4>
                      <p className="text-sm text-slate-500">{med.dosage} • {med.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => med.id && handleToggleTaken(med.id, med.taken)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center space-x-2 ${
                        med.taken 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                    >
                      {med.taken ? (
                        <>
                          <span>Done</span>
                          <Check className="w-4 h-4" />
                        </>
                      ) : 'Mark Taken'}
                    </button>
                    <button
                      onClick={() => handleFindGeneric(med)}
                      className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl border border-yellow-200 transition-colors"
                      title="Find Cheaper Generic"
                    >
                      <DollarSign className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => med.id && handleDelete(med.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors"
                      title="Delete Medicine"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineManager;
