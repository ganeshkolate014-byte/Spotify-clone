import React from 'react';
import { Check, X, ArrowLeft, Cloud, Music, Smartphone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPromo: React.FC = () => {
  const navigate = useNavigate();

  const FeatureRow = ({ title, guest, premium }: { title: string, guest: boolean | string, premium: boolean | string }) => (
    <div className="grid grid-cols-[1.5fr_1fr_1fr] py-4 border-b border-white/10 items-center last:border-0">
        <span className="text-xs md:text-base text-white/70 font-medium pr-2">{title}</span>
        <div className="flex justify-center text-white/30">
            {typeof guest === 'boolean' ? (
                guest ? <Check size={20} /> : <X size={20} />
            ) : <span className="text-xs md:text-sm font-bold">{guest}</span>}
        </div>
        <div className="flex justify-center text-[#1DB954]">
             {typeof premium === 'boolean' ? (
                premium ? <Check size={24} strokeWidth={3} /> : <X size={24} />
            ) : <span className="text-xs md:text-sm font-bold">{premium}</span>}
        </div>
    </div>
  );

  return (
    <div className="min-h-full bg-black text-white font-sans flex flex-col relative overflow-y-auto pb-10">
      
      {/* Background Ambience */}
      <div className="fixed top-0 right-0 w-full h-[500px] bg-gradient-to-b from-[#1DB954]/20 to-black opacity-40 z-0 pointer-events-none"></div>

      {/* Header */}
      <div className="z-10 flex items-center justify-between p-4 sticky top-0 bg-transparent">
          <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors">
            <X size={24} className="text-white"/>
          </button>
      </div>

      <div className="z-10 flex-1 flex flex-col px-4 md:px-12 pt-2 pb-12 max-w-4xl mx-auto w-full">
          
          <div className="text-center mb-8 md:mb-10">
             <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                 Unlock the full experience.
             </h1>
             <p className="text-white/70 text-lg">
                 Log in to sync your vibe across all your devices.
             </p>
          </div>
          
          {/* Comparison Table */}
          <div className="bg-[#121212] rounded-2xl p-5 md:p-8 shadow-2xl border border-white/5 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DB954]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="grid grid-cols-[1.5fr_1fr_1fr] mb-6 pb-4 border-b border-white/20">
                  <span className="font-bold text-lg text-white">Feature</span>
                  <span className="font-bold text-center text-white/50">Guest</span>
                  <span className="font-bold text-center text-[#1DB954]">Premium</span>
              </div>

              <FeatureRow title="Ad-free Music" guest={true} premium={true} />
              <FeatureRow title="Cloud Sync (All Devices)" guest={false} premium={true} />
              <FeatureRow title="Playlist Backup" guest={false} premium={true} />
              <FeatureRow title="Profile Picture Sync" guest={false} premium={true} />
              <FeatureRow title="Audio Quality" guest="Standard" premium="High (320kbps)" />
              <FeatureRow title="Cross-Device History" guest={false} premium={true} />
              <FeatureRow title="Unlimited Skips" guest={true} premium={true} />
          </div>

          <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={() => navigate('/login')}
                className="w-full md:w-2/3 bg-white text-black font-bold py-4 rounded-full text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                  LOG IN TO SYNC
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full md:w-2/3 bg-transparent border border-white/30 text-white font-bold py-4 rounded-full text-lg hover:border-white transition-colors"
              >
                  SIGN UP FREE
              </button>
              <p className="text-[11px] text-center text-[#777] mt-4 px-4 leading-relaxed max-w-lg">
                  User data, including profile pictures and playlists, is securely stored on Cloudinary. Log in on any device (phone, laptop, tablet) to instantly access your library.
              </p>
          </div>
      </div>
    </div>
  );
};