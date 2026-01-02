import React, { useEffect, useState } from 'react';
import { Activity, Heart, Shield, Zap, Calendar, Bell, Play, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GamificationService, HealthStats, PetState } from '../services/gamificationService';
import { HealthMascot } from '../components/HealthMascot';
import { HealthScore } from '../components/HealthScore';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Dashboard = () => {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [score, setScore] = useState(0);
  const [petState, setPetState] = useState<PetState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadGamification = async () => {
      if (!user) return;

      try {
        const statsRef = doc(db, "users", user.uid, "stats", "gamification");
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
          const userStats = statsSnap.data() as HealthStats;
          const calculatedScore = GamificationService.calculateHealthScore(userStats);
          const pet = GamificationService.getPetState(calculatedScore);

          setStats(userStats);
          setScore(calculatedScore);
          setPetState(pet);
        } else {
          // Fallback to default if no data found (or maybe trigger seed?)
          const userStats = await GamificationService.getUserStats("demo-user-123");
          const calculatedScore = GamificationService.calculateHealthScore(userStats);
          const pet = GamificationService.getPetState(calculatedScore);

          setStats(userStats);
          setScore(calculatedScore);
          setPetState(pet);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    loadGamification();
  }, [user]);

  return (
    <div className="min-h-screen bg-blue-50/50 p-6 font-sans text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Hey, {user?.email?.split('@')[0] || 'User'}! Glad to have you back 👋</h2>
        </div>
        <div className="flex items-center space-x-4">
            <button className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-blue-500 transition-colors">
                <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
            </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column (Main Dashboard) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Health Score */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-slate-700">Health Score</h3>
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-slate-800">{score} <span className="text-sm font-normal text-green-500 bg-green-100 px-2 py-0.5 rounded-full">+15%</span></div>
                        <p className="text-sm text-slate-500 mt-2">Health goals achieved over the last 3 months</p>
                        <div className="w-full bg-blue-100 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${score}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Adherence */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-slate-700">Adherence</h3>
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="text-4xl font-bold text-slate-800">{stats?.adherenceRate || 0}%</div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span>Morning Medication</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span>Evening Supplements</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Diet Quality */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-slate-700">Diet Quality</h3>
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-slate-800">{stats?.dietQualityScore || 0} <span className="text-sm font-normal text-green-500 bg-green-100 px-2 py-0.5 rounded-full">+5%</span></div>
                        <p className="text-sm text-slate-500 mt-2">Nutritional goals met this week</p>
                        <div className="w-full bg-green-100 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats?.dietQualityScore || 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Chart & Pet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart Area (Emotional State) */}
                <div className="md:col-span-2 h-full">
                    <HealthScore />
                </div>

                {/* Pet Area (Urgent Support) */}
                <div className="md:col-span-1 h-full relative group">
                    <HealthMascot score={score} />
                </div>
            </div>

            {/* Bottom Section: Exercises (Nav Links) */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50">
                <h3 className="text-lg font-bold text-slate-800 mb-4">My Modules</h3>
                <p className="text-sm text-slate-500 mb-6">Tools to help maintain good physical health and support your progress</p>
                
                <div className="space-y-4">
                    <Link to="/medicines" className="flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white transition-colors group cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-500 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Serene Meds</h4>
                                <p className="text-xs text-slate-500">Track medications & interactions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-400 h-full w-[98%]"></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">98%</span>
                        </div>
                    </Link>

                    <Link to="/symptoms" className="flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white transition-colors group cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                                <Heart className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Symptom Triage</h4>
                                <p className="text-xs text-slate-500">AI Analysis & Guidance</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full w-[55%]"></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">55%</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>

        {/* Right Column (Upcoming) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Upcoming</h3>
                    <Calendar className="w-5 h-5 text-slate-400" />
                </div>

                {/* Calendar Strip */}
                <div className="flex justify-between mb-8 text-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr'].map((day, i) => (
                        <div key={day} className={`flex flex-col items-center space-y-1 ${i === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                            <span className="text-xs font-medium">{day}</span>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${i === 1 ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : ''}`}>
                                {21 + i}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Schedule List */}
                <div className="space-y-6">
                    <div className="relative pl-4 border-l-2 border-blue-100">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                        <div className="mb-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400">08:00 AM</span>
                            <span className="text-xs font-bold text-green-500 bg-green-100 px-2 py-0.5 rounded-full">Taken</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Morning Medication</h4>
                        <p className="text-xs text-slate-500">Vitamin D, Zinc</p>
                    </div>

                    <div className="relative pl-4 border-l-2 border-blue-100">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-yellow-400 ring-4 ring-yellow-100"></div>
                        <div className="mb-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400">01:00 PM</span>
                            <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Pending</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Lunch Supplements</h4>
                        <p className="text-xs text-slate-500">Omega-3</p>
                    </div>

                    <div className="relative pl-4 border-l-2 border-blue-100">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-purple-100"></div>
                        <div className="mb-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400">06:30 PM</span>
                        </div>
                        <h4 className="font-bold text-slate-800">Symptom Check-in</h4>
                        <p className="text-xs text-slate-500">Daily Log</p>
                    </div>
                </div>

                <button className="w-full mt-8 bg-slate-800 text-white py-3 rounded-xl font-medium shadow-lg shadow-slate-300 hover:bg-slate-700 transition-colors">
                    Schedule Reminder
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
