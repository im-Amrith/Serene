import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Dna, 
  Stethoscope, 
  HeartPulse, 
  Plus,
  Globe,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { seedUserData } from '../utils/seedData';

const Login = () => {
  const [email, setEmail] = useState('demo@serene.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError("Missing Firebase Configuration. Please check your .env file.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      navigate('/');
    } catch (err: any) {
      setError('Failed to sign in with Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hidden feature to initialize demo data
  const handleInitializeDemo = async () => {
    if (!window.confirm("This will create the demo account and reset its data. Continue?")) return;
    
    setLoading(true);
    setError('');
    try {
      try {
        const userCredential = await login('demo@serene.ai', 'password123');
        if (userCredential.user) {
           await seedUserData(userCredential.user.uid);
           alert("Demo account data reset!");
           navigate('/');
           return;
        }
      } catch (loginErr: any) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, 'demo@serene.ai', 'password123');
          await seedUserData(userCredential.user.uid);
          alert("Demo account created and seeded!");
          navigate('/');
        } catch (createErr: any) {
           if (createErr.code === 'auth/email-already-in-use') {
              setError("Demo account exists but password does not match 'password123'.");
           } else {
              throw createErr;
           }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to initialize demo account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#4FD1C5] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      {/* Background Bubbles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
        <Dna className="w-16 h-16 text-white/50" />
      </div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce duration-[3000ms]">
        <Stethoscope className="w-20 h-20 text-white/50" />
      </div>
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
        <HeartPulse className="w-12 h-12 text-white/50" />
      </div>
      
      {/* Wave Background (SVG) */}
      <div className="absolute bottom-0 left-0 right-0 z-0 opacity-30">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <button className="flex items-center space-x-2 bg-[#319795] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#2C7A7B] transition-colors">
          <Globe className="w-4 h-4" />
          <span>En</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[450px] z-10 overflow-hidden relative">
        <div className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 relative">
              <Plus className="w-10 h-10 text-[#4FD1C5] stroke-[4]" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-[#4FD1C5] rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-700">Welcome Back!</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4FD1C5] uppercase tracking-wider">Email or No. Handphone</label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pr-10 border-b-2 border-slate-200 focus:border-[#4FD1C5] outline-none text-slate-700 transition-colors bg-transparent placeholder-slate-300"
                  placeholder="Enter your email"
                />
                <UserIcon className="w-5 h-5 text-slate-400 absolute right-0" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pr-10 border-b-2 border-slate-200 focus:border-[#4FD1C5] outline-none text-slate-700 transition-colors bg-transparent placeholder-slate-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold text-slate-400 hover:text-[#4FD1C5] transition-colors">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#38B2AC] hover:bg-[#319795] text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "SIGN IN"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400 font-medium">OR</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-2xl transition-all flex items-center justify-center space-x-3 group"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-6 h-6 group-hover:scale-110 transition-transform"
            />
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Dont have an account?{' '}
              <button onClick={() => alert("Sign up feature coming soon!")} className="text-[#38B2AC] font-bold hover:underline">
                Sign Up
              </button>
            </p>
          </div>
          
          {/* Hidden Demo Trigger */}
          <div className="mt-4 text-center opacity-20 hover:opacity-100 transition-opacity">
             <button onClick={handleInitializeDemo} className="text-xs text-slate-400 underline">
               Initialize Demo Data
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
