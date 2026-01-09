import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
        <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24V15.563H7.078V12.073H10.125V9.429C10.125 6.422 11.917 4.76 14.658 4.76C15.97 4.76 17.344 4.995 17.344 4.995V7.948H15.83C14.34 7.948 13.875 8.873 13.875 9.822V12.073H17.203L16.67 15.563H13.875V24C19.612 23.094 24 18.1 24 12.073Z" fill="white"/>
    </svg>
);

const AppleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="w-5 h-5 shrink-0"><path d="M16.8995 13.5686C16.9407 10.9702 19.0967 9.68069 19.1996 9.62925C18.0673 7.99343 16.3129 7.74627 15.7055 7.72569C14.2127 7.5713 12.7616 8.60069 12.0101 8.60069C11.2481 8.60069 10.0551 7.73598 8.82998 7.75657C7.23455 7.77715 5.76295 8.68303 4.94998 10.0938C3.2926 12.9712 4.52789 17.2435 6.14324 19.5804C6.93605 20.723 7.87284 21.9893 9.11822 21.9378C10.3124 21.8967 10.7757 21.1658 12.2262 21.1658C13.6669 21.1658 14.0787 21.9378 15.3445 21.9069C16.6517 21.876 17.4651 20.7127 18.2476 19.5701C19.1534 18.2525 19.5343 16.9761 19.5446 16.9143C19.5137 16.904 16.8481 15.8746 16.8995 13.5686ZM14.779 5.25492C15.4276 4.4623 15.8599 3.37115 15.7364 2.2903C14.7996 2.33147 13.6566 2.91823 12.9875 3.72115C12.3801 4.43142 11.8345 5.56372 11.9786 6.61369C13.0286 6.69604 14.1202 6.13003 14.779 5.25492Z"/></svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-b from-[#191919] to-black text-white flex flex-col p-8">
      
      {/* Top Bar */}
      <div className="w-full flex justify-start mb-8 md:mb-12">
           <img 
              src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" 
              alt="Spotify" 
              className="h-8 md:h-10 w-auto" 
           />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-[734px] mx-auto w-full">
        
        <div className="w-full max-w-[324px] sm:max-w-[400px] flex flex-col gap-8">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-center mb-4">Log in to Spotify</h1>

            {error && (
                <div className="bg-[#e91429] text-white p-3 rounded text-sm text-center flex items-center justify-center gap-2 font-medium">
                   <span>⚠️</span> {error}
                </div>
            )}

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-2.5">
                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex items-center justify-center gap-4 w-full bg-transparent border border-[#878787] hover:border-white text-white font-bold py-3 px-8 rounded-full transition-all relative group"
                >
                    <div className="absolute left-6"><GoogleIcon /></div>
                    <span>Continue with Google</span>
                </button>

                <button 
                    className="flex items-center justify-center gap-4 w-full bg-[#1877F2] border border-transparent hover:brightness-105 text-white font-bold py-3 px-8 rounded-full transition-all relative"
                >
                    <div className="absolute left-6"><FacebookIcon /></div>
                    <span>Continue with Facebook</span>
                </button>

                <button 
                    className="flex items-center justify-center gap-4 w-full bg-black border border-[#878787] hover:border-white text-white font-bold py-3 px-8 rounded-full transition-all relative"
                >
                    <div className="absolute left-6"><AppleIcon /></div>
                    <span>Continue with Apple</span>
                </button>
            </div>

            <div className="flex items-center gap-4 my-2">
                <div className="h-[1px] bg-[#292929] flex-1"></div>
                <span className="text-sm font-bold text-white">OR</span>
                <div className="h-[1px] bg-[#292929] flex-1"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
               
               <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-white">Email or username</label>
                  <input 
                    type="email" 
                    required
                    className="bg-[#121212] border border-[#727272] rounded-[4px] px-3.5 py-3.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder-[#727272]"
                    placeholder="Email or username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-white">Password</label>
                  <input 
                    type="password" 
                    required
                    className="bg-[#121212] border border-[#727272] rounded-[4px] px-3.5 py-3.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder-[#727272]"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
               </div>

               <div className="flex items-center gap-3 mt-1">
                   <div className="relative flex items-center">
                       <input 
                         type="checkbox" 
                         id="remember"
                         checked={rememberMe}
                         onChange={(e) => setRememberMe(e.target.checked)}
                         className="peer h-4 w-4 appearance-none rounded-[2px] border border-[#727272] bg-[#121212] checked:bg-[#1DB954] checked:border-[#1DB954] transition-all cursor-pointer"
                       />
                       <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5" viewBox="0 0 14 14" fill="none">
                           <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                       </svg>
                   </div>
                   <label htmlFor="remember" className="text-sm text-white cursor-pointer select-none">Remember me</label>
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#1DB954] text-black font-bold text-base py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4 flex items-center justify-center uppercase tracking-widest shadow-lg hover:bg-[#1ed760]"
               >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Log In'}
               </button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-2">
                <a href="#" className="text-white font-bold underline hover:text-[#1DB954] text-sm transition-colors">Forgot your password?</a>
                
                <div className="w-full h-[1px] bg-[#292929] my-2"></div>
                
                <div className="flex items-center gap-2 text-[#B3B3B3] text-sm md:text-base">
                    Don't have an account? 
                    <Link to="/signup" className="text-white hover:text-[#1DB954] hover:underline font-bold transition-colors">Sign up for Spotify</Link>
                </div>
            </div>

            <button onClick={() => navigate('/')} className="text-sm text-[#B3B3B3] hover:text-white flex items-center justify-center gap-1 mt-6">
                 <ArrowLeft size={16} /> Back to Web Player
            </button>
        </div>
      </div>
      
      {/* Footer Legal (Visual Only) */}
      <div className="text-[10px] text-[#555] text-center w-full mt-8">
          This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
      </div>
    </div>
  );
};
