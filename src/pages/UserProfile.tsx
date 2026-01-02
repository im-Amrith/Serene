import { useState, useEffect } from 'react';
import { Printer, Share, Moon, Wifi, User, Shield, AlertTriangle, Copy, Smartphone, FileText, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const UserProfile = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user: authUser } = useAuth();
  
  // Mock User Data State
  const [user, setUser] = useState({
    name: "Guest User",
    id: "...",
    guardianLevel: "Level 1",
    bloodType: "Unknown",
    allergies: [] as string[],
    emergencyContacts: [] as any[]
  });

  // Form State
  const [editForm, setEditForm] = useState(user);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;
      
      try {
        const docRef = doc(db, "users", authUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userData = {
            name: data.name || "User",
            id: authUser.uid,
            guardianLevel: data.guardianLevel || "Level 1",
            bloodType: data.bloodType || "Unknown",
            allergies: data.allergies || [],
            emergencyContacts: data.emergencyContacts || []
          };
          setUser(userData);
          setEditForm(userData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const generateShareLink = () => {
    const token = Math.random().toString(36).substring(7);
    const link = `https://serene.ai/share/${user.id}?token=${token}`;
    setShareLink(link);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateWalletPass = () => {
    // Create a dummy pass object
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.serene.id",
      serialNumber: user.id,
      teamIdentifier: "SERENE_AI",
      organizationName: "Serene",
      description: "Medical ID Passport",
      generic: {
        primaryFields: [
          { key: "name", label: "Name", value: user.name }
        ],
        secondaryFields: [
          { key: "blood", label: "Blood Type", value: user.bloodType },
          { key: "allergies", label: "Allergies", value: user.allergies.join(", ") }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(passData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-pass.json'; // In a real app, this would be .pkpass
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Wallet Pass downloaded! (Simulated .pkpass)");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would toggle a class on the document body or context
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    try {
      const docRef = doc(db, "users", authUser.uid);
      await setDoc(docRef, {
        name: editForm.name,
        guardianLevel: editForm.guardianLevel,
        bloodType: editForm.bloodType,
        allergies: editForm.allergies,
        emergencyContacts: editForm.emergencyContacts
      }, { merge: true });
      
      setUser(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel
      setEditForm(user);
      setIsEditing(false);
    } else {
      // Start Editing
      setEditForm(user);
      setIsEditing(true);
    }
  };

  return (
    <div className={`space-y-6 p-6 bg-blue-50/30 rounded-3xl min-h-[calc(100vh-8rem)] transition-colors ${isDarkMode ? 'dark:bg-slate-900' : ''}`}>
      {/* Break Glass Header */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500 rounded-lg animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-red-700 font-bold">Emergency Mode</h3>
            <p className="text-red-600/80 text-sm">In case of emergency, tap to alert contacts</p>
          </div>
        </div>
        <a 
          href={user.emergencyContacts?.[0]?.phone ? `sms:${user.emergencyContacts[0].phone}?body=I need help! My location is...` : '#'}
          className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-red-600/20 ${!user.emergencyContacts?.[0] ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            if (!user.emergencyContacts?.[0]) {
              e.preventDefault();
              alert("No emergency contacts available.");
              return;
            }
            if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              e.preventDefault();
              alert(`Simulating SMS to ${user.emergencyContacts[0].phone}: "I need help! My location is..."`);
            }
          }}
        >
          <Smartphone className="w-4 h-4" />
          <span>Text SOS</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Identity Card */}
        <div className="md:col-span-1 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm flex flex-col items-center text-center relative group">
          <button 
            onClick={handleEditToggle}
            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 hover:text-blue-600 transition-all"
            title={isEditing ? "Cancel Editing" : "Edit Profile"}
          >
            {isEditing ? <Check className="w-4 h-4 text-red-500" /> : <User className="w-4 h-4" />}
          </button>

          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-1 mb-4 shadow-lg">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
               <User className="w-12 h-12 text-slate-400" />
            </div>
          </div>
          
          {isEditing ? (
            <input 
              type="text" 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="text-xl font-bold text-slate-800 text-center bg-white/50 border border-blue-200 rounded-lg px-2 py-1 mb-1 w-full"
            />
          ) : (
            <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
          )}
          
          <p className="text-slate-500 font-mono text-sm mb-4">{user.id}</p>
          
          <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>{user.guardianLevel}</span>
          </div>

          {isEditing && (
            <div className="w-full mt-4 text-left">
              <label className="text-xs text-slate-400 uppercase font-bold ml-1">Emergency Contact</label>
              <input 
                type="tel" 
                placeholder="+1 (555) 000-0000"
                value={editForm.emergencyContacts?.[0]?.phone || ''}
                onChange={(e) => {
                  const newContacts = [...(editForm.emergencyContacts || [])];
                  if (!newContacts[0]) newContacts[0] = { name: 'Emergency', phone: '' };
                  newContacts[0].phone = e.target.value;
                  setEditForm({...editForm, emergencyContacts: newContacts});
                }}
                className="text-sm font-medium text-slate-800 bg-white/50 border border-blue-200 rounded-lg w-full mt-1 p-2"
              />
            </div>
          )}

          {isEditing && (
            <button 
              onClick={handleSaveProfile}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Save Changes
            </button>
          )}
        </div>

        {/* Emergency Passport */}
        <div className="md:col-span-2 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 opacity-5 pointer-events-none">
            <FileText className="w-64 h-64 text-slate-900" />
          </div>
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Medical Passport</h3>
              <p className="text-slate-500">Travel-Safe Digital ID</p>
            </div>
            <button 
              onClick={handlePrint}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors text-slate-600"
              title="Print Card"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/60 rounded-2xl border border-white/50">
                  <p className="text-xs text-slate-400 uppercase font-bold">Blood Type</p>
                  {isEditing ? (
                    <select 
                      value={editForm.bloodType}
                      onChange={(e) => setEditForm({...editForm, bloodType: e.target.value})}
                      className="text-xl font-bold text-slate-800 bg-white/50 border border-blue-200 rounded-lg w-full mt-1"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">{user.bloodType}</p>
                  )}
                </div>
                <div className="p-4 bg-white/60 rounded-2xl border border-white/50">
                  <p className="text-xs text-slate-400 uppercase font-bold">Allergies</p>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.allergies.join(", ")}
                      onChange={(e) => setEditForm({...editForm, allergies: e.target.value.split(",").map(s => s.trim())})}
                      className="text-sm font-medium text-slate-800 bg-white/50 border border-blue-200 rounded-lg w-full mt-1 p-1"
                      placeholder="Comma separated"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.allergies.map(a => (
                        <span key={a} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handleGenerateWalletPass}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium shadow-lg shadow-slate-800/20 hover:bg-slate-900 transition-colors flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Generate Wallet Pass</span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
               {/* Using API for QR Code to avoid dependency issues in this environment */}
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://serene-app.com/sos/${user.id}`} 
                 alt="Emergency QR" 
                 className="w-32 h-32"
               />
               <p className="text-xs text-slate-400 mt-2 font-mono">SCAN FOR VITALS</p>
            </div>
          </div>
        </div>

        {/* Doctor Access */}
        <div className="md:col-span-2 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Share className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Doctor Share</h3>
              <p className="text-slate-500 text-sm">Secure 24-hour access link</p>
            </div>
          </div>

          {!shareLink ? (
            <button 
              onClick={generateShareLink}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-green-500 hover:text-green-600 hover:bg-green-50/50 transition-all flex items-center justify-center space-x-2"
            >
              <Share className="w-5 h-5" />
              <span>Generate 24-Hour Link</span>
            </button>
          ) : (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between">
              <div className="truncate flex-1 mr-4">
                <p className="text-xs text-green-700 font-bold uppercase mb-1">Active Link (Expires in 24h)</p>
                <p className="text-sm text-slate-600 font-mono truncate">{shareLink}</p>
              </div>
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-white text-green-600 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Settings & Offline Status */}
        <div className="md:col-span-1 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
              <div className="flex items-center space-x-3">
                <Wifi className={`w-5 h-5 ${isOffline ? 'text-slate-400' : 'text-green-500'}`} />
                <span className="text-slate-700 font-medium">Connection</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isOffline ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                {isOffline ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
              <div className="flex items-center space-x-3">
                <Moon className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700 font-medium">Dark Mode</span>
              </div>
              <div 
                className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                onClick={toggleDarkMode}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isDarkMode ? 'left-5' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;