import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log("DistilleryEvents: Attempting authentication for", email);
    
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("DistilleryEvents: Auth failed", error.message);
        setError(error.message);
        setLoading(false);
      } else {
        console.log("DistilleryEvents: Auth successful. Session initialized.");
        // App.tsx state listener will pick this up
      }
    } catch (err: any) {
      console.error("DistilleryEvents: Unexpected auth crash", err);
      setError("A system error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-10 bg-[#1a1a1a] text-center">
          <div className="w-14 h-14 bg-amber-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Distillery<span className="text-amber-500">Events</span></h1>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mt-2">Operations Terminal</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Identity</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 transition-all font-medium outline-none"
              placeholder="admin@domain.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secret Key</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-amber-500 transition-all font-medium outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-amber-500 font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl transition-all active:scale-95 text-xs disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Access Pipeline'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;