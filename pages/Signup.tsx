import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { usePlayerStore } from '../store/playerStore';
import { Music, ArrowLeft, Loader2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = usePlayerStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.signup(name, email.toLowerCase().trim(), password);
      loginUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
               <Music size={24} className="text-black" />
           </div>
           <h1 className="text-3xl font-bold text-center">Sign up to start listening</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
           
           {error && (
             <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
               {error}
             </div>
           )}

           <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">What's your email?</label>
              <input 
                type="email" 
                required
                className="bg-[#121212] border border-[#555] rounded p-3 focus:outline-none focus:border-white transition-colors"
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Create a password</label>
              <input 
                type="password" 
                required
                className="bg-[#121212] border border-[#555] rounded p-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
           </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">What should we call you?</label>
              <input 
                type="text" 
                required
                className="bg-[#121212] border border-[#555] rounded p-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Enter a profile name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <span className="text-xs text-[#B3B3B3]">This appears on your profile.</span>
           </div>

           <button 
              type="submit" 
              disabled={loading}
              className="bg-[#1DB954] text-black font-bold py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center"
           >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign Up'}
           </button>
        </form>

        <div className="h-[1px] bg-[#292929] w-full"></div>

        <div className="text-center text-[#B3B3B3]">
           Have an account? <Link to="/login" className="text-white hover:underline font-bold">Log in</Link>
        </div>

        <button onClick={() => navigate('/')} className="text-sm text-[#B3B3B3] hover:text-white flex items-center justify-center gap-1">
             <ArrowLeft size={14} /> Back to App
        </button>
      </div>
    </div>
  );
};