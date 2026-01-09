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

  const handleGoogleLogin = async () => {
      setLoading(true);
      setError('');
      try {
          const user = await authService.loginWithGoogle();
          loginUser(user);
          navigate('/');
      } catch (err: any) {
          setError(err.message || 'Google Login failed.');
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-2">
           <img 
              src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" 
              alt="Spotify" 
              className="h-10 w-auto" 
           />
           <h1 className="text-3xl font-bold tracking-tighter">Log in to Spotify</h1>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
        )}

        {/* Social Login */}
        <div className="flex flex-col gap-2">
            <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-4 w-full bg-transparent border border-[#555] hover:border-white text-white font-bold py-3 rounded-full transition-all"
            >
                <svg width="24" height="24" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>Continue with Google</span>
            </button>
        </div>

        <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] bg-[#292929] flex-1"></div>
            <span className="text-sm font-bold text-white/50">OR</span>
            <div className="h-[1px] bg-[#292929] flex-1"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
           
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