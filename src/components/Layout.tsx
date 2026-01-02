import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Pill, Stethoscope, Apple, Menu, X, Eye, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Camera, User, Dumbbell, Mic, Heart, LogOut } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { VisionService } from '../services/visionService';
import SimpleMode from '../pages/SimpleMode';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { isSimpleMode, toggleSimpleMode, speak } = useAccessibility();
  const [isDescribing, setIsDescribing] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDescribeScreen = async () => {
    setIsDescribing(true);
    const screenName = location.pathname === '/' ? 'Dashboard' : 
                       location.pathname.includes('medicines') ? 'MedicineManager' :
                       location.pathname.includes('symptoms') ? 'SymptomChecker' :
                       location.pathname.includes('nutrition') ? 'NutritionAnalyzer' : 'Unknown';
    
    const description = await VisionService.describeScreen(screenName, {});
    speak(description);
    setIsDescribing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (isSimpleMode) {
    return <SimpleMode />;
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
    { path: '/medicines', label: 'Medicine Manager', icon: <Pill className="w-5 h-5" /> },
    { path: '/symptoms', label: 'Symptom Checker', icon: <Stethoscope className="w-5 h-5" /> },
    { path: '/nutrition', label: 'Nutrition Analyzer', icon: <Apple className="w-5 h-5" /> },
    { path: '/physio', label: 'Physio-Bot', icon: <Dumbbell className="w-5 h-5" /> },
    { path: '/respiro', label: 'Respiro-Scan', icon: <Mic className="w-5 h-5" /> },
    { path: '/mirror-check', label: 'Mirror-Check Vitals', icon: <Heart className="w-5 h-5" /> },
    { path: '/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-blue-50/30 text-slate-800 flex font-sans transition-colors duration-300">
      {/* Floating Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:sticky md:top-4 h-[calc(100vh-32px)] m-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-blue-900/5 transform transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} 
        md:translate-x-0 
        ${isCollapsed ? 'md:w-24' : 'md:w-72'}`}
      >
        {/* Header & Logo */}
        <div className="p-6 flex justify-between items-center">
          {!isCollapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              Serene
            </h1>
          )}
          {isCollapsed && (
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-blue-500/30">
               S
             </div>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1.5 shadow-md text-slate-500 hover:text-blue-600 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Hero Action: AI Scan */}
        <div className={`px-4 mb-6 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <button className={`group relative flex items-center justify-center ${isCollapsed ? 'w-12 h-12 rounded-2xl' : 'w-full py-3.5 rounded-2xl space-x-3'} bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-300`}>
                <Camera className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                {!isCollapsed && <span className="font-bold tracking-wide">AI Health Scan</span>}
                
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3.5 transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                    <span className={`font-medium ${isActive ? 'text-blue-900 font-semibold' : ''}`}>
                        {item.label}
                    </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                )}
              </Link>
            );
          })}
          
          {/* Accessibility Section */}
          <div className={`pt-6 mt-4 border-t border-slate-100 ${isCollapsed ? 'px-0' : 'px-2'}`}>
            {!isCollapsed && (
              <div className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Accessibility
              </div>
            )}
            <button
              onClick={handleDescribeScreen}
              disabled={isDescribing}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-3'} py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all mb-1`}
              title={isCollapsed ? "Describe Screen" : ""}
            >
              <Eye className={`w-5 h-5 ${isDescribing ? 'animate-pulse text-blue-500' : ''}`} />
              {!isCollapsed && <span className="text-sm font-medium">{isDescribing ? 'Analyzing...' : 'Describe'}</span>}
            </button>
            <button
              onClick={toggleSimpleMode}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-3'} py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all`}
              title={isCollapsed ? "Simple Mode" : ""}
            >
              {isSimpleMode ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
              {!isCollapsed && <span className="text-sm font-medium">Simple Mode</span>}
            </button>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-3'} py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-2`}
              title={isCollapsed ? "Sign Out" : ""}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-white/50 p-4 md:hidden flex items-center sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-slate-700 mr-4">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Serene</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
