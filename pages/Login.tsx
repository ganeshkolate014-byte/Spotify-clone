import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = usePlayerStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.login(email.toLowerCase().trim(), password);
      loginUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 mb-2">
           <img 
              src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" 
              alt="Spotify" 
              className="h-10 w-auto" 
           />
           <h1 className="text-3xl font-bold tracking-tighter">Log in to Spotify</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
           
           {error && (
             <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
               {error}
             </div>
           )}

           <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Email</label>
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
              <label className="text-sm font-bold">Password</label>
              <input 
                type="password" 
                required
                className="bg-[#121212] border border-[#555] rounded p-3 focus:outline-none focus:border-white transition-colors"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
           </div>

           <button 
              type="submit" 
              disabled={loading}
              className="bg-[#1DB954] text-black font-bold py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center uppercase tracking-widest text-sm"
           >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Log In'}
           </button>
        </form>

        <div className="h-[1px] bg-[#292929] w-full"></div>

        <div className="text-center text-[#B3B3B3]">
           Don't have an account? <Link to="/signup" className="text-white hover:underline font-bold">Sign up for Spotify</Link>
        </div>
        
        <button onClick={() => navigate('/')} className="text-sm text-[#B3B3B3] hover:text-white flex items-center justify-center gap-1">
             <ArrowLeft size={14} /> Back to Web Player
        </button>
      </div>
    </div>
  );
};